import { Client } from '@notionhq/client';
import { NotionImageProcessor, ImageProcessingStats } from './image-processor';
import { sanitizeMarkdown } from './markdown-sanitizer';

export class NotionToMDXConverter {
  private notion: Client;
  private imageProcessor: NotionImageProcessor;

  constructor(notionApiSecret: string, imagePrefix: string = 'blog') {
    this.notion = new Client({ auth: notionApiSecret });
    this.imageProcessor = new NotionImageProcessor(notionApiSecret, imagePrefix);
  }

  async convertToMDX(
    pageId: string,
    slug?: string,
  ): Promise<{ content: string; imageStats?: ImageProcessingStats }> {
    try {
      // 图片处理必须在 retrieveMarkdown 之前：把 Notion 托管图换成 SM.MS 外链，
      // 否则官方 API 返回的 markdown 里仍是会过期的 pre-signed URL。
      let imageStats: ImageProcessingStats | undefined;
      if (slug) {
        console.log(`🖼️ Processing images for ${slug}...`);
        imageStats = await this.imageProcessor.processPageImages(pageId, slug);
      }

      const response = await this.notion.pages.retrieveMarkdown({ page_id: pageId });

      if (response.truncated) {
        console.warn(
          `⚠️ Page ${pageId} markdown was truncated. unknown_block_ids=`,
          response.unknown_block_ids,
        );
      }

      const content = sanitizeMarkdown(response.markdown, {
        slug: slug ?? pageId,
        pageId,
      });

      return {
        content,
        imageStats,
      };
    } catch (error) {
      console.error(`Error converting page ${pageId} to markdown:`, error);
      throw error;
    }
  }

  async updateBlogLastFetchedTime(
    pageId: string,
    propertyName = 'last_fetched_time',
  ): Promise<void> {
    try {
      const now = new Date().toISOString();
      await this.notion.pages.update({
        page_id: pageId,
        properties: {
          [propertyName]: {
            date: {
              start: now,
            },
          },
        },
      });
      console.log(`📝 Updated ${propertyName} for page ${pageId}`);
    } catch (error) {
      console.error(`❌ Failed to update ${propertyName} for page ${pageId}:`, error);
      throw error;
    }
  }

  /**
   * 检查页面是否有图片需要处理
   */
  async checkImagesNeedProcessing(
    pageId: string,
  ): Promise<{ needsProcessing: boolean; imageCount: number }> {
    return this.imageProcessor.checkImagesNeedProcessing(pageId);
  }

  /**
   * 获取图片处理器实例
   */
  getImageProcessor(): NotionImageProcessor {
    return this.imageProcessor;
  }
}
