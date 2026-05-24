import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';
import { CacheManager, FileUtils } from './content-utils';

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

  const pattern = path.join(KOTOBA_DIR, '*.md');
  const files = await glob(pattern);

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

  const pattern = path.join(KOTOBA_DIR, '*.md');
  const files = await glob(pattern);

  const posts = files
    .map((filePath) => {
      const fileContent = FileUtils.readFileSync(filePath);
      if (!fileContent) return null;

      try {
        const { data, content } = matter(fileContent) as {
          data: KotobaFrontmatterData;
          content: string;
        };
        const meta = buildKotobaMeta(data);
        return { ...meta, content };
      } catch (error) {
        console.error(`Error parsing kotoba file ${filePath}:`, error);
        return null;
      }
    })
    .filter((p): p is KotobaPostWithContent => p !== null && p.page_id !== '')
    .sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime());

  kotobaWithContentCache.set(posts);
  return posts;
}

export async function getKotobaPostsByTag(tag: string): Promise<KotobaPost[]> {
  const posts = await getAllKotobaPosts();
  return posts.filter((p) => p.tags.includes(tag));
}

export async function getKotobaPostsWithContentByTag(
  tag: string,
): Promise<KotobaPostWithContent[]> {
  const all = await getAllKotobaPostsWithContent();
  return all.filter((p) => p.tags.includes(tag));
}

export async function getAllKotobaTags(): Promise<string[]> {
  const posts = await getAllKotobaPosts();
  const tagSet = new Set<string>();
  posts.forEach((p) => p.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}
