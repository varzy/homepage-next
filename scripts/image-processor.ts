import { Client } from '@notionhq/client';
import { BlockObjectResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { smmsUploadExternal, getSmmsUrl, isSmmsUrl, generateFileName } from './smms-uploader';

export interface ImageProcessingStats {
  total: number;
  processed: number;
  skipped: number;
  errors: number;
}

export class NotionImageProcessor {
  private notion: Client;
  private imagePrefix: string;

  constructor(notionApiSecret: string, imagePrefix: string = 'blog') {
    this.notion = new Client({ auth: notionApiSecret });
    this.imagePrefix = imagePrefix;
  }

  /**
   * 处理页面中的所有图片，将 Notion 托管的图片和非 SM.MS 的外部图片上传到 SM.MS
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
      await this.processBlocks(pageId, slug, stats);

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
    slug: string,
    stats: ImageProcessingStats,
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
          await this.processImageBlock(block, slug, stats);
        }

        // 递归处理子块
        if (block.has_children) {
          await this.processBlocks(block.id, slug, stats);
        }
      }

      // 处理分页
      if (response.has_more && response.next_cursor) {
        await this.processBlocks(blockId, slug, stats, response.next_cursor);
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
    slug: string,
    stats: ImageProcessingStats,
  ): Promise<void> {
    if (block.type !== 'image') return;

    try {
      const imageBlock = block.image;
      let imageUrl: string;
      let needsUpload = false;

      if (imageBlock.type === 'file') {
        // Notion 托管的图片，需要上传
        imageUrl = imageBlock.file.url;
        needsUpload = true;
        console.log(`🔄 Found Notion-hosted image: ${block.id}`);
      } else if (imageBlock.type === 'external') {
        // 外部图片，检查是否已经是 SM.MS 链接
        imageUrl = imageBlock.external.url;
        needsUpload = !isSmmsUrl(imageUrl);

        if (needsUpload) {
          console.log(`🔄 Found external image (non-SMMS): ${imageUrl}`);
        } else {
          console.log(`✅ Image already on SMMS: ${imageUrl}`);
        }
      } else {
        stats.skipped++;
        return;
      }

      if (!needsUpload) {
        stats.skipped++;
        return;
      }

      // 生成文件名
      const fileName = generateFileName(imageUrl, `${this.imagePrefix}_${slug}`, block.id);

      try {
        // 上传到 SM.MS
        const uploadResult = await smmsUploadExternal(imageUrl, fileName);
        const smmsUrl = getSmmsUrl(uploadResult);

        if (!smmsUrl) {
          throw new Error('Failed to get SMMS URL from upload result');
        }

        // 更新 Notion 块
        await this.notion.blocks.update({
          block_id: block.id,
          image: {
            external: { url: smmsUrl },
          },
        });

        stats.processed++;
        console.log(`✅ Image uploaded and updated: ${fileName} -> ${smmsUrl}`);

        // 添加延迟以避免频率限制
        await this.delay(100);
      } catch (uploadError) {
        stats.errors++;
        console.error(`❌ Failed to process image ${fileName}:`, uploadError);

        // 继续处理其他图片，不中断整个流程
      }
    } catch (error) {
      stats.errors++;
      console.error(`❌ Error processing image block ${block.id}:`, error);
    }
  }

  /**
   * 处理页面 property 中所有 files 类型字段，将非 SM.MS 的图片上传到 SM.MS 并更新 Notion 页面属性
   */
  async processPageFileProperties(
    page: PageObjectResponse,
    slug: string,
  ): Promise<PageObjectResponse> {
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
          needsUpload = !isSmmsUrl(url);
          if (needsUpload) {
            console.log(`🔄 Found external property image (non-SMMS) in "${propName}": ${url}`);
          } else {
            console.log(`✅ Property image already on SMMS in "${propName}"`);
          }
        } else {
          newFiles.push(file);
          continue;
        }

        if (!needsUpload) {
          newFiles.push(file);
          continue;
        }

        const fileName = generateFileName(url, `${this.imagePrefix}_${slug}`);
        try {
          const result = await smmsUploadExternal(url, fileName);
          const smmsUrl = getSmmsUrl(result);
          if (smmsUrl) {
            newFiles.push({ type: 'external', name: file.name || '', external: { url: smmsUrl } });
            anyUpdated = true;
            console.log(`✅ Property image uploaded: ${fileName} -> ${smmsUrl}`);
          } else {
            newFiles.push(file);
          }
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
          if (imageBlock.type === 'file') {
            needsProcessing = true;
          } else if (imageBlock.type === 'external' && !isSmmsUrl(imageBlock.external.url)) {
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
