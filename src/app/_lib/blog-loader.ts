import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';
import { CacheManager, FileUtils } from './content-utils';

const BLOG_CONFIG = {
  CONTENT_POSTS_DIR: path.join(process.cwd(), 'content/posts'),
  CONTENT_PAGES_DIR: path.join(process.cwd(), 'content/pages'),
  TEXT_CLEANUP_PATTERNS: [
    /```[\s\S]*?```/g,
    /`[^`]*`/g,
    /!\[[^\]]*\]\([^)]*\)/g,
    /^#+\s+/gm,
    /^>\s?/gm,
    /^[-*+]\s+/gm,
    /[*_~]/g,
  ],
};

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
  last_fetched_time?: string;
  page_id?: string;
  icon?: string;
};

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
  last_fetched_time?: string;
  page_id: string;
  dateAmericaStyle: string;
  icon?: string;
}

export interface PostWithContent extends PostMeta {
  content: string;
}

function formatDate(dateString: string): string {
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

function buildPostMeta(data: FrontmatterData): PostMeta {
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
    last_fetched_time: data.last_fetched_time,
    page_id: data.page_id || '',
    dateAmericaStyle: formatDate(data.date || ''),
    icon: data.icon,
  };
}

function cleanTextForWordCount(text: string): string {
  let cleanedText = text;
  BLOG_CONFIG.TEXT_CLEANUP_PATTERNS.forEach((pattern) => {
    cleanedText = cleanedText.replace(pattern, '');
  });
  return cleanedText.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');
}

const postsCache = new CacheManager<PostMeta[]>();
const postFilesCache = new CacheManager<string[]>();

async function listPostFiles(): Promise<string[]> {
  if (!FileUtils.dirExists(BLOG_CONFIG.CONTENT_POSTS_DIR)) return [];

  const cachedFiles = postFilesCache.get();
  if (cachedFiles) return cachedFiles;

  try {
    const pattern = path.join(BLOG_CONFIG.CONTENT_POSTS_DIR, '*.md');
    const files = await glob(pattern);
    postFilesCache.set(files);
    return files;
  } catch (error) {
    console.error('Error listing post files:', error);
    return [];
  }
}

function parseMetaFromFile(filePath: string): PostMeta | null {
  const parsed = FileUtils.parseFrontmatter<FrontmatterData>(filePath);
  if (!parsed) return null;
  return buildPostMeta(parsed.data);
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const cachedPosts = postsCache.get();
  if (cachedPosts) return cachedPosts;

  if (!FileUtils.dirExists(BLOG_CONFIG.CONTENT_POSTS_DIR)) {
    console.warn(`Content directory does not exist: ${BLOG_CONFIG.CONTENT_POSTS_DIR}`);
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

export async function getCurrentCategoryNextPost(category: string, slug: string): Promise<PostMeta | null> {
  return findAdjacentPost(category, slug, 1);
}

export async function getPostsByTag(tag: string): Promise<PostMeta[]> {
  const posts = await getAllPosts();
  return posts.filter((post) => post.tags.includes(tag));
}

export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts();
  const tagSet = new Set<string>();
  posts.forEach((post) => post.tags.forEach((tag) => tagSet.add(tag)));
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
    const baseDir =
      contentType === 'posts' ? BLOG_CONFIG.CONTENT_POSTS_DIR : BLOG_CONFIG.CONTENT_PAGES_DIR;
    const filePath = path.join(baseDir, `${slug}.md`);

    const parsed = FileUtils.parseFrontmatter<FrontmatterData>(filePath);
    if (!parsed) return null;

    const meta = buildPostMeta(parsed.data);
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
  if (!FileUtils.dirExists(BLOG_CONFIG.CONTENT_POSTS_DIR)) return 0;

  const files = await listPostFiles();
  let total = 0;

  for (const filePath of files) {
    const fileContent = FileUtils.readFileSync(filePath);
    if (!fileContent) continue;

    try {
      const { content } = matter(fileContent);
      const cleanedText = cleanTextForWordCount(content);
      total += cleanedText.replace(/\s+/g, '').length;
    } catch {
      continue;
    }
  }

  return total;
}
