import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { PostMetadata } from './types';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionImageProcessor, ImageProcessingStats } from './image-processor';

export class NotionToMDXConverter {
  private notion: Client;
  private n2m: NotionToMarkdown;
  private imageProcessor: NotionImageProcessor;

  constructor(notionApiSecret: string) {
    this.notion = new Client({ auth: notionApiSecret });
    this.n2m = new NotionToMarkdown({ notionClient: this.notion });
    // 图片上传功能默认启用
    this.imageProcessor = new NotionImageProcessor(notionApiSecret);
  }

  async getAllPosts(databaseId: string): Promise<PostMetadata[]> {
    return this.getAllByType(databaseId, 'Post');
  }

  async getAllPages(databaseId: string): Promise<PostMetadata[]> {
    return this.getAllByType(databaseId, 'Page');
  }

  async getAllByType(databaseId: string, type: string): Promise<PostMetadata[]> {
    const items: PostMetadata[] = [];
    let startCursor: string | undefined;

    do {
      const response = await this.notion.dataSources.query({
        data_source_id: databaseId,
        filter: {
          and: [
            { property: 'status', select: { equals: 'Published' } },
            { property: 'type', select: { equals: type } },
          ],
        },
        sorts: [{ property: 'date', direction: 'descending' }],
        start_cursor: startCursor,
      });

      const pageItems = response.results.map((page) => this.extractPostMeta(page as PageObjectResponse));
      items.push(...pageItems);
      startCursor = response.next_cursor || undefined;
    } while (startCursor);

    return items;
  }

  async getPostsByStatus(databaseId: string, status: string): Promise<PostMetadata[]> {
    const posts: PostMetadata[] = [];
    let startCursor: string | undefined;

    do {
      const response = await this.notion.dataSources.query({
        data_source_id: databaseId,
        filter: {
          and: [
            { property: 'status', select: { equals: status } },
            { property: 'type', select: { equals: 'Post' } },
          ],
        },
        sorts: [{ property: 'date', direction: 'descending' }],
        start_cursor: startCursor,
      });

      const pagePosts = response.results.map((page) => this.extractPostMeta(page as PageObjectResponse));

      posts.push(...pagePosts);
      startCursor = response.next_cursor || undefined;
    } while (startCursor);

    return posts;
  }

  async convertToMDX(pageId: string, slug?: string): Promise<{ content: string; imageStats?: ImageProcessingStats }> {
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

  async updateBlogLastFetchedTime(pageId: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      await this.notion.pages.update({
        page_id: pageId,
        properties: {
          blog_last_fetched_time: {
            date: {
              start: now,
            },
          },
        },
      });
      console.log(`📝 Updated blog_last_fetched_time for page ${pageId}`);
    } catch (error) {
      console.error(`❌ Failed to update blog_last_fetched_time for page ${pageId}:`, error);
      throw error;
    }
  }

  private extractPostMeta(page: PageObjectResponse): PostMetadata {
    const properties = page.properties;

    const getTextProperty = (prop: any): string => {
      if (!prop) return '';
      if (prop.type === 'title') {
        return prop.title.map((text: any) => text.plain_text).join('');
      }
      if (prop.type === 'rich_text') {
        return prop.rich_text.map((text: any) => text.plain_text).join('');
      }
      return '';
    };

    const getSelectProperty = (prop: any): string => {
      return prop?.select?.name || '';
    };

    const getMultiSelectProperty = (prop: any): string[] => {
      return prop?.multi_select?.map((item: any) => item.name) || [];
    };

    const getDateProperty = (prop: any): string => {
      return prop?.date?.start || '';
    };

    // 提取页面 emoji 图标
    const getPageIcon = (page: PageObjectResponse): string | undefined => {
      return page.icon?.type === 'emoji' ? (page.icon.emoji as string) : undefined;
    };

    return {
      notion_id: page.id,
      title: getTextProperty(properties.title),
      category: getSelectProperty(properties.category),
      type: getSelectProperty(properties.type),
      status: getSelectProperty(properties.status),
      tags: getMultiSelectProperty(properties.tags),
      date: getDateProperty(properties.date),
      slug: getTextProperty(properties.slug),
      summary: getTextProperty(properties.summary),
      last_edited_time: page.last_edited_time,
      blog_last_fetched_time: getDateProperty(properties.blog_last_fetched_time),
      icon: getPageIcon(page),
    };
  }

  /**
   * 检查页面是否有图片需要处理
   */
  async checkImagesNeedProcessing(pageId: string): Promise<{ needsProcessing: boolean; imageCount: number }> {
    return this.imageProcessor.checkImagesNeedProcessing(pageId);
  }

  /**
   * 获取图片处理器实例
   */
  getImageProcessor(): NotionImageProcessor {
    return this.imageProcessor;
  }
}

export function generateMDXContent(metadata: PostMetadata, content: string): string {
  const frontmatter = `---
title: "${metadata.title.replace(/"/g, '\\"')}"
category: "${metadata.category}"
type: "${metadata.type}"
status: "${metadata.status}"
tags: [${metadata.tags.map((tag) => `"${tag}"`).join(', ')}]
date: "${metadata.date}"
slug: "${metadata.slug}"
summary: "${metadata.summary.replace(/"/g, '\\"')}"
last_edited_time: "${metadata.last_edited_time}"
blog_last_fetched_time: "${metadata.blog_last_fetched_time || ''}"
notion_id: "${metadata.notion_id}"${metadata.icon ? `\nicon: "${metadata.icon}"` : ''}
---

${content}`;

  return frontmatter;
}
