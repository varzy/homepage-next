import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { NotionImageProcessor, ImageProcessingStats } from './image-processor';

export class NotionToMDXConverter {
  private notion: Client;
  private n2m: NotionToMarkdown;
  private imageProcessor: NotionImageProcessor;

  constructor(notionApiSecret: string, imagePrefix: string = 'blog') {
    this.notion = new Client({ auth: notionApiSecret });
    this.n2m = new NotionToMarkdown({ notionClient: this.notion });
    this.imageProcessor = new NotionImageProcessor(notionApiSecret, imagePrefix);
  }

  async convertToMDX(
    pageId: string,
    slug?: string,
  ): Promise<{ content: string; imageStats?: ImageProcessingStats }> {
    try {
      // 总是处理图片（图片上传功能默认启用）
      let imageStats: ImageProcessingStats | undefined;
      if (slug) {
        console.log(`🖼️ Processing images for ${slug}...`);
        imageStats = await this.imageProcessor.processPageImages(pageId, slug);
      }

      // 转换为 Markdown
      const mdBlocks = await this.n2m.pageToMarkdown(pageId);
      const mdString = this.n2m.toMarkdownString(mdBlocks);

      return {
        content: mdString.parent,
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
