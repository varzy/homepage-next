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
  // 检查缓存
  if (isCacheValid() && postsCache) {
    return postsCache;
  }

  try {
    // 确保内容目录存在
    if (!fs.existsSync(CONTENT_POSTS_DIR)) {
      console.warn(`Content directory does not exist: ${CONTENT_POSTS_DIR}`);
      return [];
    }

    // 获取所有 MD 文件
    const pattern = path.join(CONTENT_POSTS_DIR, '*.md');
    const files = await glob(pattern);

    // 解析所有文件
    const posts = files.map(parseMetaFromFile);

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
