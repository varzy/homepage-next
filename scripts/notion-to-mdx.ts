import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { PostMetadata } from './types';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

export class NotionToMDXConverter {
  private notion: Client;
  private n2m: NotionToMarkdown;

  constructor(notionApiSecret: string) {
    this.notion = new Client({ auth: notionApiSecret });
    this.n2m = new NotionToMarkdown({ notionClient: this.notion });
  }

  async getAllPosts(databaseId: string): Promise<PostMetadata[]> {
    const posts: PostMetadata[] = [];
    let startCursor: string | undefined;

    do {
      const response = await this.notion.databases.query({
        database_id: databaseId,
        filter: {
          and: [
            { property: 'status', select: { equals: 'Published' } },
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

  async convertToMDX(pageId: string): Promise<string> {
    try {
      const mdBlocks = await this.n2m.pageToMarkdown(pageId);
      const mdString = this.n2m.toMarkdownString(mdBlocks);
      return mdString.parent;
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
    };
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
notion_id: "${metadata.notion_id}"
---

${content}`;

  return frontmatter;
}
