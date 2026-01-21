import fs from 'fs';
import { glob } from 'glob';
import matter from 'gray-matter';
import path from 'path';

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
  page_id: string;
  dateAmericaStyle: string;
  icon?: string;
}

export interface PostWithContent extends PostMeta {
  content: string;
}

const CONFIG = {
  CACHE_DURATION: 5 * 60 * 1000, // 5分钟缓存
  CONTENT_POSTS_DIR: path.join(process.cwd(), 'content/posts'),
  CONTENT_PAGES_DIR: path.join(process.cwd(), 'content/pages'),
  TEXT_CLEANUP_PATTERNS: [
    /```[\s\S]*?```/g, // 三引号代码块
    /`[^`]*`/g, // 行内代码
    /!\[[^\]]*\]\([^)]*\)/g, // 图片
    /^#+\s+/gm, // 标题标记
    /^>\s?/gm, // 引用标记
    /^[-*+]\s+/gm, // 列表项标记
    /[\*_~]/g, // 粗体/斜体/删除线符号
  ],
};

class CacheManager<T> {
  private cache: T | null = null;
  private cacheTime = 0;

  constructor(private duration: number = CONFIG.CACHE_DURATION) {}

  isValid(): boolean {
    return this.cache !== null && Date.now() - this.cacheTime < this.duration;
  }

  get(): T | null {
    return this.isValid() ? this.cache : null;
  }

  set(data: T): void {
    this.cache = data;
    this.cacheTime = Date.now();
  }

  clear(): void {
    this.cache = null;
    this.cacheTime = 0;
  }
}

const postsCache = new CacheManager<PostMeta[]>();
const postFilesCache = new CacheManager<string[]>();

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
  page_id?: string;
  icon?: string;
};

class FileUtils {
  static dirExists(dirPath: string): boolean {
    try {
      return fs.existsSync(dirPath);
    } catch {
      return false;
    }
  }

  static readFileSync(filePath: string): string | null {
    try {
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
      return null;
    }
  }

  static parseFrontmatter(filePath: string): { data: FrontmatterData; content: string } | null {
    const fileContent = this.readFileSync(filePath);
    if (!fileContent) return null;

    try {
      const parsed = matter(fileContent);
      return {
        data: parsed.data as FrontmatterData,
        content: parsed.content,
      };
    } catch (error) {
      console.error(`Error parsing frontmatter in ${filePath}:`, error);
      return null;
    }
  }
}

class DataUtils {
  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric' as const,
        month: 'short' as const,
        day: '2-digit' as const,
      });
    } catch {
      return dateString;
    }
  }

  static buildPostMeta(data: FrontmatterData): PostMeta {
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
      page_id: data.page_id || '',
      dateAmericaStyle: this.formatDate(data.date || ''),
      icon: data.icon,
    };
  }

  static cleanTextForWordCount(text: string): string {
    let cleanedText = text;

    CONFIG.TEXT_CLEANUP_PATTERNS.forEach((pattern) => {
      cleanedText = cleanedText.replace(pattern, '');
    });

    cleanedText = cleanedText.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

    return cleanedText;
  }
}

async function listPostFiles(): Promise<string[]> {
  if (!FileUtils.dirExists(CONFIG.CONTENT_POSTS_DIR)) {
    return [];
  }

  const cachedFiles = postFilesCache.get();
  if (cachedFiles) {
    return cachedFiles;
  }

  try {
    const pattern = path.join(CONFIG.CONTENT_POSTS_DIR, '*.md');
    const files = await glob(pattern);
    postFilesCache.set(files);
    return files;
  } catch (error) {
    console.error('Error listing post files:', error);
    return [];
  }
}

function parseMetaFromFile(filePath: string): PostMeta | null {
  const parsed = FileUtils.parseFrontmatter(filePath);
  if (!parsed) return null;

  return DataUtils.buildPostMeta(parsed.data);
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const cachedPosts = postsCache.get();
  if (cachedPosts) {
    return cachedPosts;
  }

  if (!FileUtils.dirExists(CONFIG.CONTENT_POSTS_DIR)) {
    console.warn(`Content directory does not exist: ${CONFIG.CONTENT_POSTS_DIR}`);
    return [];
  }

  const files = await listPostFiles();
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

export async function getCategoryPosts(category: string): Promise<PostMeta[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.category === category);
}

function findAdjacentPost(
  category: string,
  slug: string,
  offset: number,
): Promise<PostMeta | null> {
  return getCategoryPosts(category).then((posts) => {
    const index = posts.findIndex((post) => post.slug === slug);
    return posts[index + offset] || null;
  });
}

export async function getPrevPost(category: string, slug: string): Promise<PostMeta | null> {
  return findAdjacentPost(category, slug, -1);
}

export async function getNextPost(category: string, slug: string): Promise<PostMeta | null> {
  return findAdjacentPost(category, slug, 1);
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

export async function parseContent(
  contentType: 'posts' | 'pages',
  slug: string,
): Promise<PostWithContent | null> {
  try {
    const baseDir = contentType === 'posts' ? CONFIG.CONTENT_POSTS_DIR : CONFIG.CONTENT_PAGES_DIR;
    const filePath = path.join(baseDir, `${slug}.md`);

    const parsed = FileUtils.parseFrontmatter(filePath);
    if (!parsed) return null;

    const meta = DataUtils.buildPostMeta(parsed.data);
    return { ...meta, content: parsed.content };
  } catch (error) {
    console.error(`Error loading ${contentType} ${slug}:`, error);
    return null;
  }
}

export async function getPostWithContent(slug: string): Promise<PostWithContent | null> {
  return parseContent('posts', slug);
}

export async function getPageWithContent(slug: string): Promise<PostWithContent | null> {
  return parseContent('pages', slug);
}

export async function getPostsTotalWords(): Promise<number> {
  if (!FileUtils.dirExists(CONFIG.CONTENT_POSTS_DIR)) {
    return 0;
  }

  const files = await listPostFiles();
  let total = 0;

  for (const filePath of files) {
    const parsed = FileUtils.parseFrontmatter(filePath);
    if (!parsed) continue;

    const cleanedText = DataUtils.cleanTextForWordCount(parsed.content);
    const lengthWithoutWhitespace = cleanedText.replace(/\s+/g, '').length;
    total += lengthWithoutWhitespace;
  }

  return total;
}
