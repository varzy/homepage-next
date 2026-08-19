import path from 'path';
import { readWithContent } from './content-utils';

const PAGES_DIR = path.join(process.cwd(), 'content/pages');

type PageFrontmatterData = {
  page_id?: string;
  title?: string;
  slug?: string;
  status?: string;
  last_edited_time?: string;
  last_fetched_time?: string;
};

export interface PageMeta {
  page_id: string;
  title: string;
  slug: string;
  status: string;
  last_edited_time: string;
  last_fetched_time?: string;
}

export interface PageWithContent extends PageMeta {
  content: string;
}

function buildPageMeta(data: PageFrontmatterData): PageMeta {
  return {
    page_id: data.page_id || '',
    title: data.title || '',
    slug: data.slug || '',
    status: data.status || '',
    last_edited_time: data.last_edited_time || '',
    last_fetched_time: data.last_fetched_time,
  };
}

export async function getPageWithContent(slug: string): Promise<PageWithContent | null> {
  return readWithContent<PageFrontmatterData, PageMeta>(PAGES_DIR, slug, buildPageMeta, 'page');
}
