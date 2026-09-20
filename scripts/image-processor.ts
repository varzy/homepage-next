import { Client } from '@notionhq/client';
import { BlockObjectResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { isR2Url, r2ImageUploader, type R2ImageUploader } from './r2-uploader';

export interface ImageProcessingStats {
  total: number;
  processed: number;
  skipped: number;
  errors: number;
}

export class NotionImageProcessor {
  private notion: Client;
  private imagePrefix: string;
  private uploader: R2ImageUploader;

  constructor(notionApiSecret: string, imagePrefix: string = 'blog') {
    this.notion = new Client({ auth: notionApiSecret });
    this.imagePrefix = imagePrefix;
    this.uploader = r2ImageUploader();
  }

  /**
   * 处理页面中的所有图片：Notion 托管图片与未托管的外链图片均下载并上传到 R2，
   * 随后回写 Notion 块。已托管在 R2 的外链跳过，故可安全重复执行。
   */
  async processPageImages(pageId: string, slug: string): Promise<ImageProcessingStats> {
    console.log(`📷 Processing images for page: ${slug}`);

    const stats: ImageProcessingStats = {
      total: 0,
      processed: 0,
      skipped: 0,
      errors: 0,
    };

    try {
      await this.processBlocks(pageId, stats, pageId);

      console.log(`📷 Image processing completed for ${slug}:`);
      console.log(
        `   Total: ${stats.total}, Processed: ${stats.processed}, Skipped: ${stats.skipped}, Errors: ${stats.errors}`,
      );

      return stats;
    } catch (error) {
      console.error(`❌ Error processing images for ${slug}:`, error);
      throw error;
    }
  }

  /**
   * 递归处理所有块
   */
  private async processBlocks(
    blockId: string,
    stats: ImageProcessingStats,
    pageId: string,
    startCursor?: string,
  ): Promise<void> {
    try {
      const response = await this.notion.blocks.children.list({
        block_id: blockId,
        start_cursor: startCursor,
      });

      const blocks = response.results as BlockObjectResponse[];

      for (const block of blocks) {
        if (block.type === 'image') {
          stats.total++;
          await this.processImageBlock(block, stats, pageId);
        }

        // 递归处理子块
        if (block.has_children) {
          await this.processBlocks(block.id, stats, pageId);
        }
      }

      // 处理分页
      if (response.has_more && response.next_cursor) {
        await this.processBlocks(blockId, stats, pageId, response.next_cursor);
      }
    } catch (error) {
      console.error(`❌ Error processing blocks for blockId ${blockId}:`, error);
      throw error;
    }
  }

  /**
   * 处理单个图片块
   */
  private async processImageBlock(
    block: BlockObjectResponse,
    stats: ImageProcessingStats,
    pageId: string,
  ): Promise<void> {
    if (block.type !== 'image') return;

    try {
      const imageBlock = block.image;
      let imageUrl: string;
      let needsUpload = false;

      if (imageBlock.type === 'file') {
        // Notion 托管的图片：需上传
        imageUrl = imageBlock.file.url;
        needsUpload = true;
        console.log(`🔄 Found Notion-hosted image: ${block.id}`);
      } else if (imageBlock.type === 'external') {
        // 未托管在 R2 的外链：需上传；已托管则跳过
        imageUrl = imageBlock.external.url;
        needsUpload = !isR2Url(imageUrl);
        console.log(
          needsUpload
            ? `🔄 Found external image (not yet hosted): ${imageUrl}`
            : `✅ Image already hosted: ${imageUrl}`,
        );
      } else {
        stats.skipped++;
        return;
      }

      if (!needsUpload) {
        stats.skipped++;
        return;
      }

      // 内容寻址 key（public/{year}/{month}/{label}/{pageId}/{hash}.{ext}）由 uploader 内部组合，
      // 同页同图自然幂等。
      try {
        const uploadResult = await this.uploader.uploadExternal(imageUrl, this.imagePrefix, pageId);

        // 更新 Notion 块
        await this.notion.blocks.update({
          block_id: block.id,
          image: {
            external: { url: uploadResult.url },
          },
        });

        stats.processed++;
        console.log(
          `✅ Image uploaded and updated: ${uploadResult.fileName} -> ${uploadResult.url}`,
        );

        // 添加延迟以避免频率限制
        await this.delay(100);
      } catch (uploadError) {
        stats.errors++;
        console.error(`❌ Failed to process image ${imageUrl}:`, uploadError);

        // 继续处理其他图片，不中断整个流程
      }
    } catch (error) {
      stats.errors++;
      console.error(`❌ Error processing image block ${block.id}:`, error);
    }
  }

  /**
   * 处理页面 property 中所有 files 类型字段，将未托管的图片上传到 R2 并更新 Notion 页面属性。
   * Notion 托管图片与未托管外链均上传；已托管在 R2 的跳过。
   */
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
          const result = await this.uploader.uploadExternal(url, this.imagePrefix, page.id);
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

  /**
   * 延迟函数，用于避免API频率限制
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 检查是否有图片需要处理（预览模式）
   */
  async checkImagesNeedProcessing(
    pageId: string,
  ): Promise<{ needsProcessing: boolean; imageCount: number }> {
    let imageCount = 0;
    let needsProcessing = false;

    const checkBlocks = async (blockId: string, startCursor?: string): Promise<void> => {
      const response = await this.notion.blocks.children.list({
        block_id: blockId,
        start_cursor: startCursor,
      });

      const blocks = response.results as BlockObjectResponse[];

      for (const block of blocks) {
        if (block.type === 'image') {
          imageCount++;
          const imageBlock = block.image;
          // Notion 托管图片需处理；外链仅在未托管于 R2 时需处理
          if (
            imageBlock.type === 'file' ||
            (imageBlock.type === 'external' && !isR2Url(imageBlock.external.url))
          ) {
            needsProcessing = true;
          }
        }

        if (block.has_children) {
          await checkBlocks(block.id);
        }
      }

      if (response.has_more && response.next_cursor) {
        await checkBlocks(blockId, response.next_cursor);
      }
    };

    await checkBlocks(pageId);
    return { needsProcessing, imageCount };
  }
}
