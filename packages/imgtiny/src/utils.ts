import { readdir, stat } from 'node:fs/promises';
import { basename, extname, join, parse } from 'node:path';

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

const isSupportedImage = (file: string): boolean =>
  SUPPORTED_EXTENSIONS.has(extname(file).toLowerCase());

const isCompressedImage = (file: string): boolean => parse(file).name.endsWith('_compressed');

export const compressedStem = (file: string): string => `${parse(file).name}_compressed`;

async function findImages(
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

export async function prepareBatch(inputDir: string, outputDir: string, clean: boolean) {
  const sources = await findImages(inputDir);
  const sourceNames = new Map<string, string>();

  for (const source of sources) {
    // 输出格式可能收敛为同一扩展名，目标文件系统也可能忽略大小写。
    const stem = compressedStem(source).toLowerCase().normalize();
    const previous = sourceNames.get(stem);
    if (previous) {
      throw new Error(`压缩产物重名：${basename(previous)} 与 ${basename(source)}`);
    }
    sourceNames.set(stem, source);
  }

  const existing = sources.length > 0 ? await findImages(outputDir, 'compressed') : [];
  const existingStems = new Set(existing.map((file) => parse(file).name));
  const images = clean
    ? sources
    : sources.filter((file) => !existingStems.has(compressedStem(file)));
  return {
    images,
    skippedCount: sources.length - images.length,
    filesToClean: clean ? existing : [],
  };
}
