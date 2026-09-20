import path from 'path';
import { SITE_CONFIG } from '@/site.config';
import {
  CacheManager,
  FileUtils,
  collectTags,
  filterByTag,
  listMarkdownFiles,
  readWithContent,
} from './content-utils';

const POSTS_DIR = path.join(process.cwd(), 'content/posts');

const TEXT_CLEANUP_PATTERNS = [
  /```[\s\S]*?```/g,
  /`[^`]*`/g,
  /!\[[^\]]*\]\([^)]*\)/g,
  /^#+\s+/gm,
  /^>\s?/gm,
  /^[-*+]\s+/gm,
  /[*_~]/g,
];

type PostFrontmatterData = {
  title?: string;
  category?: string;
  type?: string;
  status?: string;
  tags?: string[] | undefined;
  date?: string;
  slug?: string;
  summary?: string;
  last_edited_time?: string;
  last_fetched_time?: string;
  page_id?: string;
  icon?: string;
};

export interface PostMeta {
  title: string;
  category: string;
  categoryKey: string;
  categoryAlias: string;
  type: string;
  status: string;
  tags: string[];
  date: string;
  slug: string;
  summary: string;
  last_edited_time: string;
  last_fetched_time?: string;
  page_id: string;
  icon?: string;
}

export interface PostWithContent extends PostMeta {
  content: string;
}

function resolveCategory(notionField: string): { key: string; alias: string } {
  const entry = Object.entries(SITE_CONFIG.categories).find(
    ([, c]) => c.notionField === notionField,
  );
  if (!entry) return { key: '', alias: '' };
  const [key, { alias }] = entry;
  return { key, alias };
}

function buildPostMeta(data: PostFrontmatterData): PostMeta {
  const category = data.category || '';
  const { key: categoryKey, alias: categoryAlias } = resolveCategory(category);

  return {
    title: data.title || '',
    category,
    categoryKey,
    categoryAlias,
    type: data.type || '',
    status: data.status || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    date: data.date || '',
    slug: data.slug || '',
    summary: data.summary || '',
    last_edited_time: data.last_edited_time || '',
    last_fetched_time: data.last_fetched_time,
    page_id: data.page_id || '',
    icon: data.icon,
  };
}

function cleanTextForWordCount(text: string): string {
  let cleanedText = text;
  TEXT_CLEANUP_PATTERNS.forEach((pattern) => {
    cleanedText = cleanedText.replace(pattern, '');
  });
  return cleanedText.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}

const postsCache = new CacheManager<PostMeta[]>();
const postFilesCache = new CacheManager<string[]>();

function parseMetaFromFile(filePath: string): PostMeta | null {
  const parsed = FileUtils.parseFrontmatter<PostFrontmatterData>(filePath);
  if (!parsed) return null;
  return buildPostMeta(parsed.data);
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const cachedPosts = postsCache.get();
  if (cachedPosts) return cachedPosts;

  if (!FileUtils.dirExists(POSTS_DIR)) {
    console.warn(`Posts directory does not exist: ${POSTS_DIR}`);
    return [];
  }

  const files = await listMarkdownFiles(POSTS_DIR, postFilesCache);
  const posts = files
    .map(parseMetaFromFile)
    .filter((post): post is PostMeta => post !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  postsCache.set(posts);
  return posts;
}

export async function getAllPostsCount(): Promise<number> {
  const posts = await getAllPosts();
  return posts.length;
}

export async function getPostBySlug(slug: string): Promise<PostMeta | null> {
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === slug) || null;
}

export async function getCategoryPosts(categoryKey: string): Promise<PostMeta[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.categoryKey === categoryKey);
}

async function findAdjacentPost(
  categoryKey: string,
  slug: string,
  offset: number,
): Promise<PostMeta | null> {
  const posts = await getCategoryPosts(categoryKey);
  const index = posts.findIndex((post) => post.slug === slug);
  return posts[index + offset] || null;
}

export async function getPrevPost(categoryKey: string, slug: string): Promise<PostMeta | null> {
  return findAdjacentPost(categoryKey, slug, -1);
}

export async function getCurrentCategoryNextPost(
  categoryKey: string,
  slug: string,
): Promise<PostMeta | null> {
  return findAdjacentPost(categoryKey, slug, 1);
}

export async function getPostsByTag(tag: string): Promise<PostMeta[]> {
  return filterByTag(await getAllPosts(), tag);
}

export async function getAllTags(): Promise<string[]> {
  return collectTags(await getAllPosts());
}

export async function getAllCategories(): Promise<string[]> {
  const posts = await getAllPosts();
  const categorySet = new Set<string>();
  posts.forEach((post) => {
    if (post.categoryKey) categorySet.add(post.categoryKey);
  });
  return Array.from(categorySet).sort();
}

export async function getPostWithContent(slug: string): Promise<PostWithContent | null> {
  return readWithContent<PostFrontmatterData, PostMeta>(POSTS_DIR, slug, buildPostMeta, 'post');
}

export async function getPostsTotalWords(): Promise<number> {
  if (!FileUtils.dirExists(POSTS_DIR)) return 0;

  const files = await listMarkdownFiles(POSTS_DIR, postFilesCache);
  let total = 0;

  for (const filePath of files) {
    const parsed = FileUtils.parseFrontmatter<PostFrontmatterData>(filePath);
    if (!parsed) continue;

    const cleanedText = cleanTextForWordCount(parsed.content);
    total += cleanedText.replace(/\s+/g, '').length;
  }

  return total;
}
