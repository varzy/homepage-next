import type { Client, ImageBlockObjectResponse, PageObjectResponse } from '@notionhq/client';
import { compressImage, type CompressedImage } from '@zy/image-compression';
import {
  R2ImageUploader,
  extractExtension,
  isR2Url,
  type R2UploaderOptions,
} from './r2-uploader.ts';

export interface ImageProcessingStats {
  total: number;
  processed: number;
  skipped: number;
  errors: number;
}

const UPLOAD_DELAY_MS = 100;
const HEIC_EXTS = new Set(['heic', 'heif']);

export interface NotionImageProcessorOptions {
  /** 调用方的 Notion 客户端（no2tg2 需传入带代理的实例） */
  notion: Client;
  /** R2 对象 key 的 label 段，如 'posts'、'kotoba'、'no2tg2' */
  label: string;
  /** R2 凭据等配置，缺省读环境变量 */
  uploader?: R2UploaderOptions;
}

/**
 * 遍历 Notion 页面的图片块与 files 类型属性，把未托管在 R2 的图片
 * 压缩后上传到 R2 并回写 Notion。已托管在 R2 的跳过，可安全重复执行。
 */
export class NotionImageProcessor {
  private notion: Client;
  private uploader: R2ImageUploader;
  private label: string;

  constructor(opts: NotionImageProcessorOptions) {
    this.notion = opts.notion;
    this.uploader = new R2ImageUploader(opts.uploader);
    this.label = opts.label;
  }

  async processPageImages(pageId: string): Promise<ImageProcessingStats> {
    const stats: ImageProcessingStats = { total: 0, processed: 0, skipped: 0, errors: 0 };
    await this.processBlocks(pageId, pageId, stats);
    return stats;
  }

  /** 处理页面 property 中所有 files 类型字段，将未托管的图片上传到 R2 并更新页面属性。 */
  async processPageFileProperties(page: PageObjectResponse): Promise<PageObjectResponse> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedProperties: Record<string, any> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patchedProps: Record<string, any> = {};

    for (const [propName, prop] of Object.entries(page.properties)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = prop as any;
      if (p.type !== 'files') continue;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const files: any[] = p.files;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newFiles: any[] = [];
      let anyUpdated = false;

      for (const file of files) {
        let url: string;
        let needsUpload = false;

        if (file.type === 'file') {
          url = file.file.url;
          needsUpload = true;
          console.log(`🔄 Found Notion-hosted property image in "${propName}": ${file.name}`);
        } else if (file.type === 'external') {
          url = file.external.url;
          needsUpload = !isR2Url(url);
          console.log(
            needsUpload
              ? `🔄 Found external property image (not yet hosted) in "${propName}": ${url}`
              : `✅ Property image already hosted in "${propName}"`,
          );
        } else {
          newFiles.push(file);
          continue;
        }

        if (!needsUpload) {
          newFiles.push(file);
          continue;
        }

        try {
          const result = await this.uploadImage(url, page.id);
          newFiles.push({ type: 'external', name: file.name || '', external: { url: result.url } });
          anyUpdated = true;
          console.log(`✅ Property image uploaded: ${result.fileName} -> ${result.url}`);
        } catch (err) {
          console.warn(`⚠️ Failed to upload property image for "${propName}":`, err);
          newFiles.push(file);
        }
      }

      if (anyUpdated) {
        patchedProps[propName] = { files: newFiles };
        updatedProperties[propName] = { ...p, files: newFiles };
      }
    }

    if (Object.keys(patchedProps).length === 0) return page;

    await this.notion.pages.update({
      page_id: page.id,
      properties: patchedProps,
    });

    return {
      ...page,
      properties: { ...page.properties, ...updatedProperties },
    };
  }

  /** 递归处理所有块 */
  private async processBlocks(
    blockId: string,
    pageId: string,
    stats: ImageProcessingStats,
    startCursor?: string,
  ): Promise<void> {
    const response = await this.notion.blocks.children.list({
      block_id: blockId,
      page_size: 100,
      start_cursor: startCursor,
    });

    for (const block of response.results) {
      if (!('type' in block)) continue;

      if (block.type === 'image') {
        stats.total++;
        await this.processImageBlock(block, pageId, stats);
      }

      if (block.has_children) {
        await this.processBlocks(block.id, pageId, stats);
      }
    }

    if (response.has_more && response.next_cursor) {
      await this.processBlocks(blockId, pageId, stats, response.next_cursor);
    }
  }

  private async processImageBlock(
    block: ImageBlockObjectResponse,
    pageId: string,
    stats: ImageProcessingStats,
  ): Promise<void> {
    try {
      const imageBlock = block.image;
      let imageUrl: string;
      let needsUpload = false;

      if (imageBlock.type === 'file') {
        imageUrl = imageBlock.file.url;
        needsUpload = true;
      } else if (imageBlock.type === 'external') {
        imageUrl = imageBlock.external.url;
        // 历史版本曾把未能转码的 HEIC 原样传到 R2，浏览器无法显示，需重新处理
        needsUpload = !isR2Url(imageUrl) || HEIC_EXTS.has(extractExtension(imageUrl));
      } else {
        stats.skipped++;
        return;
      }

      if (!needsUpload) {
        stats.skipped++;
        return;
      }

      const uploadResult = await this.uploadImage(imageUrl, pageId);

      await this.notion.blocks.update({
        block_id: block.id,
        image: { external: { url: uploadResult.url } },
      });

      stats.processed++;
      console.log(`✅ Image uploaded and updated: ${uploadResult.fileName} -> ${uploadResult.url}`);

      // 添加延迟以避免 Notion API 频率限制
      await new Promise((resolve) => setTimeout(resolve, UPLOAD_DELAY_MS));
    } catch (err) {
      stats.errors++;
      console.error(`❌ Error processing image block ${block.id}:`, err);
    }
  }

  /**
   * 下载并压缩图片后上传到 R2。内容寻址 key（public/{year}/{month}/{label}/
   * {pageId}/{hash}.{ext}）由 uploader 内部组合，同页同图自然幂等。
   */
  private async uploadImage(url: string, pageId: string) {
    const image = await this.getCompressedImage(url);
    // 扩展名与 Content-Type 取自压缩后的实际格式（HEIC 会被转成 JPEG）
    return this.uploader.uploadBuffer(
      image.buffer,
      image.ext,
      this.label,
      pageId,
      image.contentType,
    );
  }

  private async getCompressedImage(url: string): Promise<CompressedImage> {
    console.log(`📥 Downloading image: ${url}`);
    const response = await fetch(url, {
      cache: 'no-cache',
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NotionImageUploader/1.0)' },
    });
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
    }

    const bytes = await response.arrayBuffer();
    return compressImage(Buffer.from(bytes), url);
  }
}
