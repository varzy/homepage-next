import sharp from 'sharp';
import { parse, join } from 'node:path';
import { mkdir, stat } from 'node:fs/promises';

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
 * 处理单张图片
 */
export async function processImage(options: ProcessOptions): Promise<ProcessResult> {
  const { inputPath, outputDir, maxWidth, quality, keepFormat } = options;

  try {
    // 确保输出目录存在
    await mkdir(outputDir, { recursive: true });

    const parsedPath = parse(inputPath);
    const originalName = parsedPath.name;
    const originalExt = parsedPath.ext.toLowerCase();

    // 确定目标格式
    // 如果 keepFormat 为 true，则使用原扩展名
    // 否则默认使用 .webp
    let targetExt = keepFormat ? originalExt : '.webp';

    // 生成输出文件名: 原名 + _compressed + 后缀
    const outputFilename = `${originalName}_compressed${targetExt}`;
    const outputPath = join(outputDir, outputFilename);

    // 获取原文件大小
    const originalStats = await stat(inputPath);
    const originalSize = originalStats.size;

    let pipeline = sharp(inputPath);

    // 读取元数据
    const metadata = await pipeline.metadata();

    // 调整尺寸 (如果宽度超过限制)
    if (metadata.width && metadata.width > maxWidth) {
      pipeline = pipeline.resize({ width: maxWidth, withoutEnlargement: true });
    }

    // 自动旋转 (处理手机/相机拍摄的 EXIF 方向)
    pipeline = pipeline.rotate();

    // 配置输出格式和质量
    if (targetExt === '.webp') {
      pipeline = pipeline.webp({ quality });
    } else if (targetExt === '.jpg' || targetExt === '.jpeg') {
      pipeline = pipeline.jpeg({ quality, mozjpeg: true });
    } else if (targetExt === '.png') {
      pipeline = pipeline.png({ quality, compressionLevel: 8, palette: true });
    } else if (targetExt === '.avif') {
      pipeline = pipeline.avif({ quality });
    } else if (targetExt === '.heic' || targetExt === '.heif') {
      // HEIC 支持可能受限，尝试使用 heif
      // 如果不支持会抛错，我们在 catch 中捕获
      pipeline = pipeline.toFormat('heif', { quality });
    } else {
      // 其他格式，尝试保持并应用质量压缩（如果 sharp 支持）
      // 如果不支持特定格式的质量参数，sharp 可能会忽略
    }

    await pipeline.toFile(outputPath);

    // 获取新文件大小
    const newStats = await stat(outputPath);

    return {
      input: inputPath,
      output: outputPath,
      originalSize,
      newSize: newStats.size,
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
