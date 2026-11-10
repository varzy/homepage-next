import { readdir, stat } from 'node:fs/promises';
import { extname, join, parse } from 'node:path';

const SUPPORTED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
  '.avif',
  '.tiff',
  '.tif',
  '.gif',
]);

export const isSupportedImage = (file: string): boolean =>
  SUPPORTED_EXTENSIONS.has(extname(file).toLowerCase());

export const isCompressedImage = (file: string): boolean =>
  parse(file).name.endsWith('_compressed');

export async function findImages(
  dir: string,
  kind: 'source' | 'compressed' = 'source',
): Promise<string[]> {
  try {
    const files = await readdir(dir);
    const imageFiles: string[] = [];

    for (const file of files) {
      if (file.startsWith('.') || !isSupportedImage(file)) continue;
      if (isCompressedImage(file) !== (kind === 'compressed')) continue;

      const fullPath = join(dir, file);

      try {
        const fileStat = await stat(fullPath);
        if (fileStat.isFile()) imageFiles.push(fullPath);
      } catch {
        console.warn(`无法读取文件状态: ${fullPath}`);
      }
    }

    return imageFiles;
  } catch (error) {
    if (kind === 'compressed' && (error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    throw new Error(`无法读取目录: ${dir}. 请确保路径存在且有权限访问。`);
  }
}
