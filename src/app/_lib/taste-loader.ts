import path from 'path';
import { glob } from 'glob';
import matter from 'gray-matter';
import { CacheManager, FileUtils } from './content-utils';

const TASTE_DIR = path.join(process.cwd(), 'content/taste');

type TasteFrontmatterData = {
  page_id?: string;
  title?: string;
  status?: string;
  category?: string;
  cover?: string;
  url?: string;
  label?: string;
  last_edited_time?: string;
  last_fetched_time?: string;
};

export interface TasteItem {
  page_id: string;
  title: string;
  status: string;
  category: string;
  cover: string;
  url?: string;
  label?: string;
  last_edited_time: string;
  last_fetched_time?: string;
}

export interface TasteItemWithContent extends TasteItem {
  content: string;
}

function buildTasteItem(data: TasteFrontmatterData): TasteItem {
  return {
    page_id: data.page_id || '',
    title: data.title || '',
    status: data.status || '',
    category: data.category || '',
    cover: data.cover || '',
    url: data.url || undefined,
    label: data.label || undefined,
    last_edited_time: data.last_edited_time || '',
    last_fetched_time: data.last_fetched_time,
  };
}

const tasteWithContentCache = new CacheManager<TasteItemWithContent[]>();

export async function getAllTasteItemsWithContent(): Promise<TasteItemWithContent[]> {
  const cached = tasteWithContentCache.get();
  if (cached) return cached;

  if (!FileUtils.dirExists(TASTE_DIR)) {
    console.warn(`Taste directory does not exist: ${TASTE_DIR}`);
    return [];
  }

  const pattern = path.join(TASTE_DIR, '*.md');
  const files = await glob(pattern);

  const items = files
    .map((filePath) => {
      const fileContent = FileUtils.readFileSync(filePath);
      if (!fileContent) return null;

      try {
        const { data, content } = matter(fileContent) as {
          data: TasteFrontmatterData;
          content: string;
        };
        const meta = buildTasteItem(data);
        if (!meta.page_id) return null;
        return { ...meta, content: content.trim() };
      } catch (error) {
        console.error(`Error parsing taste file ${filePath}:`, error);
        return null;
      }
    })
    .filter((item): item is TasteItemWithContent => item !== null);

  tasteWithContentCache.set(items);
  return items;
}

export function groupTasteByCategory(
  items: TasteItemWithContent[],
): Record<string, TasteItemWithContent[]> {
  const groups: Record<string, TasteItemWithContent[]> = {};
  for (const item of items) {
    const key = item.category || '未分类';
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
  }
  return groups;
}
