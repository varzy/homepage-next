import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';

dayjs.extend(utc);

import { APIErrorCode, Client, isFullPage, isNotionClientError } from '@notionhq/client';
import type {
  BlockObjectResponse,
  PageObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client';

import { config } from './config.ts';
import { logger } from './logger.ts';
import { createNodeProxyAgent } from './proxy.ts';

export interface NotionPage {
  id: string;
  title: string;
  createdTime: string;
  tags: string[];
  withTitle: boolean;
  titleUrl: string | null;
}

export interface RichTextSnippet {
  plainText: string;
  annotations: {
    bold: boolean;
    italic: boolean;
    strikethrough: boolean;
    underline: boolean;
    code: boolean;
  };
  href: string | null;
}

export type Paragraph = RichTextSnippet[];

export interface PageContent {
  paragraphs: Paragraph[];
  imageUrls: string[];
}

const notionProxyAgent = createNodeProxyAgent();
export const notionClient = new Client({
  auth: config.notion.token,
  agent: notionProxyAgent ?? undefined,
});

function resolveDataSourceId(): string {
  const id = config.notion.dataSourceId;
  if (!id) {
    throw new Error('Notion 配置缺失：请设置 notion.dataSourceId');
  }
  return id;
}

function extractTitle(page: PageObjectResponse): string {
  const titleProperty = page.properties.title;
  if (!titleProperty || titleProperty.type !== 'title') {
    return 'Untitled';
  }

  return (
    titleProperty.title
      .map((item) => item.plain_text)
      .join('')
      .trim() || 'Untitled'
  );
}

function extractTags(page: PageObjectResponse): string[] {
  const tagsProperty = page.properties.tags;
  if (!tagsProperty || tagsProperty.type !== 'multi_select') {
    return [];
  }
  return tagsProperty.multi_select
    .map((item) => item.name.trim())
    .filter((name) => name.length > 0);
}

function extractWithTitle(page: PageObjectResponse): boolean {
  const withTitleProperty = page.properties.with_title;
  if (!withTitleProperty || withTitleProperty.type !== 'checkbox') {
    return false;
  }
  return withTitleProperty.checkbox;
}

function extractTitleUrl(page: PageObjectResponse): string | null {
  const titleUrlProperty = page.properties.title_url;
  if (!titleUrlProperty || titleUrlProperty.type !== 'url') {
    return null;
  }
  const value = titleUrlProperty.url?.trim();
  return value && value.length > 0 ? value : null;
}

function mapRichTextSnippet(item: RichTextItemResponse): RichTextSnippet {
  return {
    plainText: item.plain_text ?? '',
    annotations: {
      bold: item.annotations.bold,
      italic: item.annotations.italic,
      strikethrough: item.annotations.strikethrough,
      underline: item.annotations.underline,
      code: item.annotations.code,
    },
    href: item.href,
  };
}

function getImageUrl(block: BlockObjectResponse): string | null {
  if (block.type !== 'image') {
    return null;
  }

  if (block.image.type === 'file') {
    return block.image.file.url;
  }

  if (block.image.type === 'external') {
    return block.image.external.url;
  }

  return null;
}

export async function queryReadyPage(): Promise<NotionPage | null> {
  const dataSourceId = resolveDataSourceId();
  let result: { results: unknown[] };
  try {
    result = await notionClient.dataSources.query({
      data_source_id: dataSourceId,
      filter: {
        and: [
          {
            property: 'status',
            select: {
              equals: 'Ready',
            },
          },
          {
            property: 'title',
            title: {
              is_not_empty: true,
            },
          },
        ],
      },
      sorts: [
        {
          property: 'created_time',
          direction: 'ascending',
        },
      ],
      page_size: 1,
    });
  } catch (error: unknown) {
    if (isNotionClientError(error) && error.code === APIErrorCode.ObjectNotFound) {
      throw new Error(
        'Notion Data Source 未找到。请在配置中使用正确的 notion.dataSourceId，并确认集成已被授权访问该数据源。',
      );
    }
    throw error;
  }

  const first = result.results[0];
  if (!first || !isFullPage(first as PageObjectResponse)) {
    logger.info({ resultCount: result.results.length }, '没有 Ready 状态的页面');
    return null;
  }
  const page = first as PageObjectResponse;

  return {
    id: page.id,
    title: extractTitle(page),
    createdTime: page.created_time,
    tags: extractTags(page),
    withTitle: extractWithTitle(page),
    titleUrl: extractTitleUrl(page),
  };
}

export async function getPageContent(pageId: string): Promise<PageContent> {
  const paragraphs: Paragraph[] = [];
  const imageUrls: string[] = [];
  let nextCursor: string | undefined;

  do {
    const response = await notionClient.blocks.children.list({
      block_id: pageId,
      page_size: 100,
      start_cursor: nextCursor,
    });

    logger.info({ blockCount: response.results.length, hasMore: response.has_more }, '获取页面块');

    for (const block of response.results) {
      if (!('type' in block)) {
        continue;
      }

      if (block.type === 'paragraph') {
        const snippets = block.paragraph.rich_text
          .map(mapRichTextSnippet)
          .filter((snippet) => snippet.plainText.length > 0);
        if (snippets.length > 0) {
          paragraphs.push(snippets);
        }
        continue;
      }

      if (block.type === 'image') {
        const imageUrl = getImageUrl(block);
        if (imageUrl) {
          imageUrls.push(imageUrl);
        }
        continue;
      }

      logger.warn({ blockType: block.type }, '跳过不支持的 block 类型');
    }

    nextCursor = response.has_more ? (response.next_cursor ?? undefined) : undefined;
  } while (nextCursor);

  return {
    paragraphs,
    imageUrls,
  };
}

function getTodayInUTC8(): string {
  return dayjs().utc().utcOffset(8).format('YYYY-MM-DD HH:mm:ss');
}

export async function markAsPublished(pageId: string): Promise<void> {
  await notionClient.pages.update({
    page_id: pageId,
    properties: {
      status: {
        select: {
          name: 'Published',
        },
      },
      published_time: {
        date: {
          start: getTodayInUTC8(),
          time_zone: 'Asia/Shanghai',
        },
      },
    },
  });
  logger.info({ pageId }, '已标记为 Published 并写入 published_time');
}
