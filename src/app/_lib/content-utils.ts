import fs from 'fs';
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
