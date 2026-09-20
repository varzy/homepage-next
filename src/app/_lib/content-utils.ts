import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';

export const CACHE_DURATION = 5 * 60 * 1000;

export class CacheManager<T> {
  private cache: T | null = null;
  private cacheTime = 0;

  constructor(private duration: number = CACHE_DURATION) {}

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

export class FileUtils {
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

  static parseFrontmatter<T extends Record<string, unknown>>(
    filePath: string,
  ): { data: T; content: string } | null {
    const fileContent = this.readFileSync(filePath);
    if (!fileContent) return null;

    try {
      const parsed = matter(fileContent);
      return { data: parsed.data as T, content: parsed.content };
    } catch (error) {
      console.error(`Error parsing frontmatter in ${filePath}:`, error);
      return null;
    }
  }
}

/**
 * 列出目录下所有 *.md 文件，复用可选的文件级缓存；目录不存在时返回 []。
 */
export async function listMarkdownFiles(
  dir: string,
  cache?: CacheManager<string[]>,
): Promise<string[]> {
  if (!FileUtils.dirExists(dir)) return [];
  const cached = cache?.get();
  if (cached) return cached;
  const files = await glob(path.join(dir, '*.md'));
  cache?.set(files);
  return files;
}

/**
 * 按 slug 读取单个文件，解析为 meta + content，封装错误处理与日志。
 */
export async function readWithContent<TFm extends Record<string, unknown>, TMeta>(
  dir: string,
  slug: string,
  buildMeta: (data: TFm) => TMeta,
  label = 'item',
): Promise<(TMeta & { content: string }) | null> {
  try {
    const filePath = path.join(dir, `${slug}.md`);
    const parsed = FileUtils.parseFrontmatter<TFm>(filePath);
    if (!parsed) return null;
    return { ...buildMeta(parsed.data), content: parsed.content };
  } catch (error) {
    console.error(`Error loading ${label} ${slug}:`, error);
    return null;
  }
}

/**
 * 汇总所有条目的 tags，去重并按字母序排序。
 */
export function collectTags<T extends { tags: string[] }>(posts: T[]): string[] {
  const tagSet = new Set<string>();
  posts.forEach((post) => post.tags.forEach((tag) => tagSet.add(tag)));
  return Array.from(tagSet).sort();
}

/**
 * 按 tag 过滤条目。
 */
export function filterByTag<T extends { tags: string[] }>(posts: T[], tag: string): T[] {
  return posts.filter((post) => post.tags.includes(tag));
}
