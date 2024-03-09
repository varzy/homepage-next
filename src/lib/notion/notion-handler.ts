import { notionApiHq } from './notion-api-hq';
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

/**
 * 获取某数据库下的全部页面
 * @param query
 */
export const getAllDatabasePages = async (query: QueryDatabaseParameters) => {
  let pages: PageObjectResponse[] = [];

  const fillPages = async (start_cursor?: string) => {
    const res = await notionApiHq.databases.query({
      ...query,
      start_cursor,
    });
    pages = [...pages, ...(res.results as PageObjectResponse[])];
    if (res.has_more && res.next_cursor) {
      await fillPages(res.next_cursor);
    }
  };
  await fillPages();

  return pages;
};

/**
 * 获取页面信息
 */
export const getPageMeta = (page: PageObjectResponse): PostMetaData => {
  return {
    id: page.id,
    title: getProperty<'title'>(page, 'title').title[0].plain_text,
    category: getProperty<'select'>(page, 'category').select?.name || '',
    summary: getProperty<'rich_text'>(page, 'summary').rich_text[0]?.plain_text || '',
    type: getProperty<'select'>(page, 'type').select?.name || '',
    slug: getProperty<'rich_text'>(page, 'slug').rich_text[0].plain_text,
    date: getProperty<'date'>(page, 'date').date?.start || '',
    tags: getProperty<'multi_select'>(page, 'tags').multi_select.map((tag) => tag.name),
  };
};

/**
 * 获取页面属性
 */
export const getProperty = <T extends PagePropertyTypeMap>(page: PageObjectResponse, property: string) => {
  return page.properties[property] as PagePropertySchema<T>;
};
