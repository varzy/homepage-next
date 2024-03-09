import { notionClient } from './notion-client';
import { PageObjectResponse, QueryDatabaseParameters } from '@notionhq/client/build/src/api-endpoints';
import { PagePropertySchema, PagePropertyTypeMap } from '@/lib/notion/notion-types';

export interface PostMetaData {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  date: string;
  type: string;
  slug: string;
}

export const getAllDatabasePages = async (query: QueryDatabaseParameters) => {
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
};

export const getAllPagesWithMeta = async (query: QueryDatabaseParameters) => {
  const allPages = await getAllDatabasePages(query);
  return allPages.map((page) => getPageMeta(page));
};

export const getPageMeta = (page: PageObjectResponse): PostMetaData => {
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
    date: getProperty<'date'>(page, 'date').date?.start || '',
    tags: getProperty<'multi_select'>(page, 'tags').multi_select.map((tag) => tag.name),
  };
};

export const getProperty = <T extends PagePropertyTypeMap>(page: PageObjectResponse, property: string) => {
  return page.properties[property] as PagePropertySchema<T>;
};
