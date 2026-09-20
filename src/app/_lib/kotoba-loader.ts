import path from 'path';
import {
  CacheManager,
  FileUtils,
  collectTags,
  filterByTag,
  listMarkdownFiles,
} from './content-utils';

const KOTOBA_DIR = path.join(process.cwd(), 'content/kotoba');

type KotobaFrontmatterData = {
  page_id?: string;
  title?: string;
  status?: string;
  tags?: string[];
  title_url?: string;
  with_title?: boolean;
  published_time?: string;
  last_edited_time?: string;
  last_fetched_time?: string;
};

export interface KotobaPost {
  page_id: string;
  title: string;
  status: string;
  tags: string[];
  titleUrl: string;
  withTitle: boolean;
  publishedDate: string;
  last_edited_time: string;
  last_fetched_time?: string;
}

export interface KotobaPostWithContent extends KotobaPost {
  content: string;
}

function buildKotobaMeta(data: KotobaFrontmatterData): KotobaPost {
  return {
    page_id: data.page_id || '',
    title: data.title || '',
    status: data.status || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    titleUrl: data.title_url || '',
    withTitle: data.with_title ?? false,
    publishedDate: data.published_time || '',
    last_edited_time: data.last_edited_time || '',
    last_fetched_time: data.last_fetched_time,
  };
}

const kotobaCache = new CacheManager<KotobaPost[]>();
const kotobaWithContentCache = new CacheManager<KotobaPostWithContent[]>();

export async function getAllKotobaPosts(): Promise<KotobaPost[]> {
  const cached = kotobaCache.get();
  if (cached) return cached;

  if (!FileUtils.dirExists(KOTOBA_DIR)) {
    console.warn(`Kotoba directory does not exist: ${KOTOBA_DIR}`);
    return [];
  }

  const files = await listMarkdownFiles(KOTOBA_DIR);

  const posts = files
    .map((filePath) => {
      const parsed = FileUtils.parseFrontmatter<KotobaFrontmatterData>(filePath);
      if (!parsed) return null;
      return buildKotobaMeta(parsed.data);
    })
    .filter((p): p is KotobaPost => p !== null && p.page_id !== '')
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());

  kotobaCache.set(posts);
  return posts;
}

export async function getAllKotobaPostsWithContent(): Promise<KotobaPostWithContent[]> {
  const cached = kotobaWithContentCache.get();
  if (cached) return cached;

  if (!FileUtils.dirExists(KOTOBA_DIR)) return [];

  const files = await listMarkdownFiles(KOTOBA_DIR);

  const posts = files
    .map((filePath) => {
      const parsed = FileUtils.parseFrontmatter<KotobaFrontmatterData>(filePath);
      if (!parsed) return null;
      return { ...buildKotobaMeta(parsed.data), content: parsed.content };
    })
    .filter((p): p is KotobaPostWithContent => p !== null && p.page_id !== '')
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());

  kotobaWithContentCache.set(posts);
  return posts;
}

export async function getKotobaPostsByTag(tag: string): Promise<KotobaPost[]> {
  return filterByTag(await getAllKotobaPosts(), tag);
}

export async function getKotobaPostsWithContentByTag(
  tag: string,
): Promise<KotobaPostWithContent[]> {
  return filterByTag(await getAllKotobaPostsWithContent(), tag);
}

export async function getAllKotobaTags(): Promise<string[]> {
  return collectTags(await getAllKotobaPosts());
}
