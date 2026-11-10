import { join, parse } from 'node:path';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { compressImage } from '@zy/shared';

export interface ProcessOptions {
  inputPath: string;
  outputDir: string;
  maxWidth: number;
  quality: number;
  keepFormat: boolean;
}

export interface ProcessResult {
  input: string;
  output: string;
  originalSize: number;
  newSize: number;
  isSuccess: boolean;
  error?: string;
}

/**
 * 处理单张图片：读文件 → shared 压缩管线 → 写 `<原名>_compressed.<实际格式扩展名>`
 */
export async function processImage(options: ProcessOptions): Promise<ProcessResult> {
  const { inputPath, outputDir, maxWidth, quality, keepFormat } = options;

  try {
    // 确保输出目录存在
    await mkdir(outputDir, { recursive: true });

    const originalSize = (await stat(inputPath)).size;

    const image = await compressImage(await readFile(inputPath), inputPath, {
      output: keepFormat ? 'auto' : 'webp',
      maxDimension: maxWidth,
      quality,
    });

    // 输出扩展名取决于压缩后的实际格式（如 HEIC→JPG），不再回填原扩展名
    const outputPath = join(outputDir, `${parse(inputPath).name}_compressed.${image.ext}`);
    await writeFile(outputPath, image.buffer);

    return {
      input: inputPath,
      output: outputPath,
      originalSize,
      newSize: image.buffer.length,
      isSuccess: true,
    };
  } catch (error: any) {
    return {
      input: inputPath,
      output: '',
      originalSize: 0,
      newSize: 0,
      isSuccess: false,
      error: error.message || String(error),
    };
  }
}

/**
 * 格式化文件大小为易读字符串 (KB, MB)
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
