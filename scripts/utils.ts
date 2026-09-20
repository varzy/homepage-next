import fs from 'fs';
import path from 'path';
import { FetchResult } from './types';

// ─── Notion property helpers ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getTextProperty = (prop: any): string => {
  if (!prop) return '';
  if (prop.type === 'title') return prop.title.map((t: any) => t.plain_text).join('');
  if (prop.type === 'rich_text') return prop.rich_text.map((t: any) => t.plain_text).join('');
  return '';
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getSelectProperty = (prop: any): string => prop?.select?.name || '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getMultiSelectProperty = (prop: any): string[] =>
  prop?.multi_select?.map((item: any) => item.name) || [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getUrlProperty = (prop: any): string => prop?.url || '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getCheckboxProperty = (prop: any): boolean => prop?.checkbox ?? false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getDateProperty = (prop: any): string => prop?.date?.start || '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getLastEditedTimeProperty = (prop: any): string => prop?.last_edited_time || '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getFilesProperty = (prop: any): string => {
  const files = prop?.files;
  if (!Array.isArray(files) || files.length === 0) return '';
  const first = files[0];
  if (first.type === 'file') return first.file.url;
  if (first.type === 'external') return first.external.url;
  return '';
};

// ─── File system helpers ──────────────────────────────────────────────────────

export function ensureDirectory(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created directory: ${dir}`);
  }
}

export function cleanupOrphanedFiles(
  dir: string,
  publishedIds: Set<string>,
  result: FetchResult,
): void {
  try {
    const files = fs.readdirSync(dir);
    let checked = 0;
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      checked++;
      const id = file.replace(/\.md$/, '');
      if (!publishedIds.has(id)) {
        try {
          fs.unlinkSync(path.join(dir, file));
          result.deleted++;
          console.log(`🗑️ Deleted orphaned file: ${file}`);
        } catch (err) {
          result.errors++;
          console.error(`❌ Failed to delete orphaned file ${file}:`, err);
        }
      }
    }
    console.log(`🧹 Orphan cleanup checked ${checked} files in ${dir}`);
  } catch (err) {
    result.errors++;
    console.error('❌ Failed during orphaned files cleanup:', err);
  }
}
