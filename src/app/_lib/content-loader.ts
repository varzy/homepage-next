import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { glob } from 'glob';

export interface PostMeta {
  title: string;
  category: string;
  type: string;
  status: string;
  tags: string[];
  date: string;
  slug: string;
  summary: string;
  last_edited_time: string;
  blog_last_fetched_time?: string;
  notion_id: string;
  dateAmericaStyle: string;
  icon?: string;
}

export interface PostWithContent extends PostMeta {
  content: string;
}

const CONTENT_POSTS_DIR = path.join(process.cwd(), 'content/posts');
const CONTENT_PAGES_DIR = path.join(process.cwd(), 'content/pages');

// 缓存机制
let postsCache: PostMeta[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

// 复用的文件列表缓存，避免多处重复 glob
let postFilesCache: string[] | null = null;
let postFilesCacheTime = 0;

async function listPostFiles(): Promise<string[]> {
  if (!fs.existsSync(CONTENT_POSTS_DIR)) {
    return [];
  }
  if (postFilesCache && Date.now() - postFilesCacheTime < CACHE_DURATION) {
    return postFilesCache;
  }
  const pattern = path.join(CONTENT_POSTS_DIR, '*.md');
  const files = await glob(pattern);
  postFilesCache = files;
  postFilesCacheTime = Date.now();
  return files;
}

function isCacheValid(): boolean {
  return postsCache !== null && Date.now() - cacheTime < CACHE_DURATION;
}

function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  } catch {
    return dateString;
  }
}

type FrontmatterData = {
  title?: string;
  category?: string;
  type?: string;
  status?: string;
  tags?: string[] | undefined;
  date?: string;
  slug?: string;
  summary?: string;
  last_edited_time?: string;
  blog_last_fetched_time?: string;
  notion_id?: string;
  icon?: string;
};

function buildMetaFromData(data: FrontmatterData): PostMeta {
  return {
    title: data.title || '',
    category: data.category || '',
    type: data.type || '',
    status: data.status || '',
    tags: Array.isArray(data.tags) ? data.tags : [],
    date: data.date || '',
    slug: data.slug || '',
    summary: data.summary || '',
    last_edited_time: data.last_edited_time || '',
    blog_last_fetched_time: data.blog_last_fetched_time,
    notion_id: data.notion_id || '',
    dateAmericaStyle: formatDate(data.date || ''),
    icon: data.icon,
  };
}

function parseMetaFromFile(filePath: string): PostMeta {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const parsed = matter(fileContent);
  return buildMetaFromData(parsed.data as FrontmatterData);
}

export async function getAllPosts(): Promise<PostMeta[]> {
  if (isCacheValid() && postsCache) {
    return postsCache;
  }

  if (!fs.existsSync(CONTENT_POSTS_DIR)) {
    console.warn(`Content directory does not exist: ${CONTENT_POSTS_DIR}`);
    return [];
  }

  const files = await listPostFiles();
  const posts = files.map(parseMetaFromFile);
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  postsCache = posts;
  cacheTime = Date.now();

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

export async function getCategoryPosts(category: string): Promise<PostMeta[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.category === category);
}

export async function getPrevPost(category: string, slug: string): Promise<PostMeta | null> {
  const posts = await getCategoryPosts(category);
  const index = posts.findIndex((post) => post.slug === slug);
  return posts[index - 1] || null;
}

export async function getNextPost(category: string, slug: string): Promise<PostMeta | null> {
  const posts = await getCategoryPosts(category);
  const index = posts.findIndex((post) => post.slug === slug);
  return posts[index + 1] || null;
}

export async function getPostsByCategory(category: string): Promise<PostMeta[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.category === category);
}

export async function getPostsByTag(tag: string): Promise<PostMeta[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.tags.includes(tag));
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts();
  const tagSet = new Set<string>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}

export async function getAllCategories(): Promise<string[]> {
  const posts = await getAllPosts();
  const categorySet = new Set<string>();

  posts.forEach((post) => {
    if (post.category) categorySet.add(post.category);
  });

  return Array.from(categorySet).sort();
}

export async function parseContent(contentType: 'posts' | 'pages', slug: string): Promise<PostWithContent | null> {
  try {
    const baseDir = contentType === 'posts' ? CONTENT_POSTS_DIR : CONTENT_PAGES_DIR;
    const filePath = path.join(baseDir, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(fileContent);
    const meta = buildMetaFromData(parsed.data as FrontmatterData);
    const content = parsed.content;
    return { ...meta, content };
  } catch (error) {
    console.error(`Error loading post ${slug}:`, error);
    return null;
  }
}

export async function getPostWithContent(slug: string) {
  return parseContent('posts', slug);
}

export async function getPageWithContent(slug: string) {
  return parseContent('pages', slug);
}

export async function getPostsTotalWords(): Promise<number> {
  if (!fs.existsSync(CONTENT_POSTS_DIR)) {
    return 0;
  }

  const files = await listPostFiles();

  let total = 0;
  for (const filePath of files) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const parsed = matter(fileContent);
    let text = parsed.content;

    // 去除代码块、行内代码、图片与链接的 URL，仅保留可读文本
    text = text.replace(/```[\s\S]*?```/g, ''); // 三引号代码块
    text = text.replace(/`[^`]*`/g, ''); // 行内代码
    text = text.replace(/!\[[^\]]*\]\([^)]*\)/g, ''); // 图片
    text = text.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'); // 链接保留可见文本
    text = text.replace(/^#+\s+/gm, ''); // 标题标记
    text = text.replace(/^>\s?/gm, ''); // 引用标记
    text = text.replace(/^[-*+]\s+/gm, ''); // 列表项标记
    text = text.replace(/[\*_~]/g, ''); // 粗体/斜体/删除线符号

    // 去掉所有空白字符后统计字数
    const lengthWithoutWhitespace = text.replace(/\s+/g, '').length;
    total += lengthWithoutWhitespace;
  }

  return total;
}
