import { notionClient } from './notion-client';
import {
  GetDatabaseParameters,
  PageObjectResponse,
  QueryDatabaseParameters,
} from '@notionhq/client/build/src/api-endpoints';
import { DatabaseMultiSelectProperty, PagePropertySchema, PagePropertyTypeMap } from '@/app/(blog)/_lib/notion-types';
import { cache } from 'react';
import Dayjs from 'dayjs';

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
}

export const getPageMeta = (page: PageObjectResponse): PostMetaData => {
  const date = getProperty<'date'>(page, 'date').date?.start || '';
  const dateAmericaStyle = Dayjs(date).format('MMM DD, YYYY');
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
    date,
    dateAmericaStyle,
    tags: getProperty<'multi_select'>(page, 'tags').multi_select.map((tag) => tag.name),
  };
};

export const getProperty = <T extends PagePropertyTypeMap>(page: PageObjectResponse, property: string) => {
  return page.properties[property] as PagePropertySchema<T>;
};
