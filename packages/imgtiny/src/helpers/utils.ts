import { readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';

const SUPPORTED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.heic',
  '.heif',
  '.avif',
  '.tiff',
  '.gif',
]);

/**
 * 扫描指定目录下的所有压缩后的图片文件（文件名包含 _compressed）
 * @param dir 目录路径
 * @returns 压缩后图片文件的完整路径列表
 */
export async function findCompressedImages(dir: string): Promise<string[]> {
  try {
    const files = await readdir(dir);
    const imageFiles: string[] = [];

    for (const file of files) {
      if (file.startsWith('.')) continue;
      if (!file.includes('_compressed')) continue;

      const fullPath = join(dir, file);

      try {
        const fileStat = await stat(fullPath);
        if (fileStat.isFile()) {
          const ext = extname(file).toLowerCase();
          if (SUPPORTED_EXTENSIONS.has(ext)) {
            imageFiles.push(fullPath);
          }
        }
      } catch {
        console.warn(`无法读取文件状态: ${fullPath}`);
      }
    }

    return imageFiles;
  } catch {
    throw new Error(`无法读取目录: ${dir}. 请确保路径存在且有权限访问。`);
  }
}

/**
 * 扫描指定目录下的所有支持的图片文件
 * @param dir 目录路径
 * @returns 图片文件的完整路径列表
 */
export async function findImages(dir: string): Promise<string[]> {
  try {
    const files = await readdir(dir);
    const imageFiles: string[] = [];

    for (const file of files) {
      // 忽略隐藏文件
      if (file.startsWith('.')) continue;

      // 忽略已经压缩过的文件 (文件名包含 _compressed)
      if (file.includes('_compressed')) continue;

      const fullPath = join(dir, file);

      try {
        const fileStat = await stat(fullPath);

        if (fileStat.isFile()) {
          const ext = extname(file).toLowerCase();
          if (SUPPORTED_EXTENSIONS.has(ext)) {
            imageFiles.push(fullPath);
          }
        }
      } catch {
        // 忽略无法读取的文件
        console.warn(`无法读取文件状态: ${fullPath}`);
      }
    }
    return imageFiles;
  } catch {
    throw new Error(`无法读取目录: ${dir}. 请确保路径存在且有权限访问。`);
  }
}
