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

const CONTENT_DIR = path.join(process.cwd(), 'content/posts');

// 缓存机制
let postsCache: PostMeta[] | null = null;
let cacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

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

function parseMDXFile(filePath: string): PostMeta {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const { data } = matter(fileContent);

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

export async function getAllPosts(): Promise<PostMeta[]> {
  // 检查缓存
  if (isCacheValid() && postsCache) {
    return postsCache;
  }

  try {
    // 确保内容目录存在
    if (!fs.existsSync(CONTENT_DIR)) {
      console.warn(`Content directory does not exist: ${CONTENT_DIR}`);
      return [];
    }

    // 获取所有 MD 文件
    const pattern = path.join(CONTENT_DIR, '*.md');
    const files = await glob(pattern);

    // 解析所有文件
    const posts = files.map(parseMDXFile);

    // 按日期降序排序
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 更新缓存
    postsCache = posts;
    cacheTime = Date.now();

    return posts;
  } catch (error) {
    console.error('Error loading posts:', error);
    return [];
  }
}

export async function getPostBySlug(slug: string): Promise<PostMeta | null> {
  const posts = await getAllPosts();
  return posts.find((post) => post.slug === slug) || null;
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

export async function getPostWithContent(slug: string): Promise<PostWithContent | null> {
  try {
    const filePath = path.join(CONTENT_DIR, `${slug}.md`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    const meta: PostMeta = {
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

    return { ...meta, content };
  } catch (error) {
    console.error(`Error loading post ${slug}:`, error);
    return null;
  }
}
