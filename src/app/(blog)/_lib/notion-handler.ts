import { notionClient } from './notion-client';
import {
  BlockObjectResponse,
  GetDatabaseParameters,
  PageObjectResponse,
  QueryDatabaseParameters,
} from '@notionhq/client/build/src/api-endpoints';
import { DatabaseMultiSelectProperty, PagePropertySchema, PagePropertyTypeMap } from '@/app/(blog)/_lib/notion-types';
import { cache } from 'react';
// import { unstable_cache as cache } from 'next/cache';
import Dayjs from 'dayjs';
import { SITE_CONFIG } from '@/site.config';
import _merge from 'deepmerge';
import { getSmmsUrl, smmsUploadExternal } from '@/utils/smms';

/**
 * Generate notion database query schema. Will default query pages that published and type equals post, and returns by date desc.
 */
export const composeDatabaseQuery = (
  options?: Omit<QueryDatabaseParameters, 'database_id'> & {
    tags?: Array<'published' | 'type_post' | 'date_desc' | 'date_asc'>;
  },
): QueryDatabaseParameters => {
  const { tags = ['published', 'type_post', 'date_desc'], ...extra } = options || {};

  const query: any = {
    database_id: SITE_CONFIG.notionDatabaseId,
    filter: { and: [] },
    sorts: [],
  };
  if (tags.includes('type_post')) query.filter.and.push({ property: 'type', select: { equals: 'Post' } });
  if (tags.includes('published')) query.filter.and.push({ property: 'status', select: { equals: 'Published' } });
  if (tags.includes('date_desc')) query.sorts.push({ property: 'date', direction: 'descending' });
  if (tags.includes('date_asc')) query.sorts.push({ property: 'date', direction: 'ascending' });

  const finalQuery = extra ? _merge(query, extra) : query;
  return finalQuery as QueryDatabaseParameters;
};

export const getDatabasePages = cache(async (query: QueryDatabaseParameters) => {
  const res = await notionClient.databases.query(query);
  return res.results as PageObjectResponse[];
});

export const getAllDatabasePages = cache(async (query: QueryDatabaseParameters) => {
  let pages: PageObjectResponse[] = [];

  const fillPages = async (start_cursor?: string) => {
    const res = await notionClient.databases.query({
      ...query,
      start_cursor,
    });
    pages = [...pages, ...(res.results as PageObjectResponse[])];
    if (res.has_more && res.next_cursor) await fillPages(res.next_cursor);
  };
  await fillPages();

  return pages;
});

export const getPagesWithMeta = cache(async (query: QueryDatabaseParameters) => {
  const pages = await getDatabasePages(query);
  return pages.map((page) => getPageMeta(page));
});

export const getAllPagesWithMeta = cache(async (query: QueryDatabaseParameters) => {
  const allPages = await getAllDatabasePages(query);
  return allPages.map((page) => getPageMeta(page));
});

export const getDatabaseMeta = cache(async (query: GetDatabaseParameters) => {
  return notionClient.databases.retrieve(query);
});

export const getDatabaseTags = cache(async (query: GetDatabaseParameters) => {
  const res = await getDatabaseMeta(query);
  const tagsProperty = res.properties['tags'] as DatabaseMultiSelectProperty;
  return tagsProperty.multi_select.options.map((tag) => tag.name);
});

export const getPageBySlug = cache(async (query: QueryDatabaseParameters, slug: string) => {
  const allPosts = await getAllPagesWithMeta(query);
  return allPosts.find((post) => post.slug === slug);
});

export interface PostMetaData {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  date: string;
  dateAmericaStyle: string;
  type: string;
  slug: string;
  icon?: string;
  // isSmmsImages: boolean;
}

export const getPageMeta = (page: PageObjectResponse): PostMetaData => {
  const date = getProperty<'date'>(page, 'date').date?.start || '';
  const dateAmericaStyle = Dayjs(date).format('MMM DD, YYYY');
  const icon = page.icon?.type === 'emoji' ? (page.icon.emoji as string) : undefined;

  return {
    id: page.id,
    title: getProperty<'title'>(page, 'title')
      .title.map((piece) => piece.plain_text || '')
      .join(''),
    category: getProperty<'select'>(page, 'category').select?.name || '',
    summary: getProperty<'rich_text'>(page, 'summary')
      .rich_text.map((piece) => piece.plain_text || '')
      .join(''),
    type: getProperty<'select'>(page, 'type').select?.name || '',
    slug: getProperty<'rich_text'>(page, 'slug')
      .rich_text.map((piece) => piece.plain_text || '')
      .join(''),
    tags: getProperty<'multi_select'>(page, 'tags').multi_select.map((tag) => tag.name),
    // isSmmsImages: getProperty<'checkbox'>(page, 'is_smms_images').checkbox,
    date,
    dateAmericaStyle,
    icon,
  };
};

export const getProperty = <T extends PagePropertyTypeMap>(page: PageObjectResponse, property: string) => {
  return page.properties[property] as PagePropertySchema<T>;
};

export const replaceNotionImageWithSmms = async (pageId: string, slug: string) => {
  console.log(`[replaceNotionImageToSmms] Ready to replace notion images with smms. Slug: ${slug}`);

  const replaceBlocks = async (blockId: string, start_cursor?: string) => {
    const res = await notionClient.blocks.children.list({ block_id: blockId, start_cursor });
    const blocks = res.results as BlockObjectResponse[];
    for (const block of blocks) {
      if (block.type === 'image') {
        // 如果是 notion 托管的图片，或者非 sm.ms 的图片，统一上传至 sm.ms
        if (
          block.image.type === 'file' ||
          (block.image.type === 'external' && !block.image.external.url.includes('sa.net'))
        ) {
          const fileUrl = block.image.type === 'file' ? block.image.file.url : block.image.external.url;
          const fileName = `blog_${slug}_${block.id}`;
          const resSmms = await smmsUploadExternal(fileUrl, fileName);
          const smmsUrl = getSmmsUrl(resSmms);
          if (smmsUrl) {
            await notionClient.blocks.update({
              block_id: block.id,
              image: { external: { url: smmsUrl } },
            });
            console.log(`[replaceNotionImageToSmms] ${fileName} has been replaced. New url: ${smmsUrl}`);
          }
        }
      }
      if (block.has_children) {
        await replaceBlocks(block.id);
      }
    }
    if (res.has_more && res.next_cursor) await replaceBlocks(blockId, res.next_cursor);
  };
  await replaceBlocks(pageId);
};
