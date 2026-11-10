import { createHash } from 'node:crypto';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { config } from './config.ts';
import { logger } from './logger.ts';

/**
 * Cloudflare R2 图片上传（基于 S3 兼容 API）。
 *
 * 上传 key 采用内容寻址、按页分组：
 *   public/{year}/{month}/{label}/{pageId}/{sha1(bytes)[:16]}.{ext}
 * 同页同图自然幂等（上传前 HEAD 跳过），可安全重复执行。
 *
 * 敏感凭据走环境变量：R2_ACCOUNT_ID、R2_ACCESS_KEY_ID、R2_SECRET_ACCESS_KEY。
 * 桶名、公开域名与路径 label 不敏感，可在环境变量中覆盖，缺省见 config.ts。
 */

export interface ImageUploadResult {
  /** 上传后的公开访问 URL */
  url: string;
  /** 存储到 R2 的对象 key */
  fileName: string;
  /** 文件大小（字节） */
  size: number;
}

/**
 * 从 URL 提取扩展名（不含点、小写）；无法识别时回退 'jpg'。
 * 仅用于生成 key 后缀与推断 Content-Type，实际上传仍以响应 content-type 为准。
 */
export const extractExtension = (url: string): string => {
  try {
    const pathname = new URL(url).pathname;
    const base = pathname.split('/').filter(Boolean).pop();
    if (base && base.includes('.')) {
      const ext = base.split('.').pop();
      if (ext && /^[a-z0-9]{1,8}$/i.test(ext)) return ext.toLowerCase();
    }
  } catch {
    // 非法 URL，无法解析扩展名
  }
  return 'jpg';
};

/**
 * 组合图片在 R2 中的对象 key（内容寻址、幂等、按页分组）。
 * - year/month：上传时间（运行时取，零 plumbing）
 * - contentHash：图片字节 sha1 前 16 位 → 同页同图自然幂等（上传前 HEAD 跳过）
 * - label/pageId：按来源库 / 按页分组，便于在 R2 列表中定位归属
 *
 * 取舍：因 key 含 pageId 与上传时间，同一张图被多页共用、或跨月重复执行时会各存一份
 * （无跨页 / 跨月去重），属可接受的小幅冗余、非数据错误。
 */
export const composeNewImageKey = (
  label: string,
  pageId: string,
  buffer: Buffer,
  ext: string,
): string => {
  const year = new Date().getFullYear().toString();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const hash = createHash('sha1').update(buffer).digest('hex').slice(0, 16);
  return `public/${year}/${month}/${label}/${pageId}/${hash}.${ext}`;
};

/**
 * 判断 URL 是否指向 R2 自定义域名（按 host 精确匹配，避免路径中含域名片段的误判；
 * URL 非法时返回 false）。
 */
export const isR2Url = (url: string): boolean => {
  try {
    return new URL(url).host === new URL(config.r2.publicDomain).host;
  } catch {
    return false;
  }
};

const CONTENT_TYPE_MAP: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
};

/** 根据扩展名推断 Content-Type，优先使用下载响应的 content-type。 */
export const getContentType = (fileName: string, fallback?: string): string => {
  if (fallback) {
    const base = fallback.split(';')[0].trim();
    if (base.startsWith('image/')) return base;
  }
  const ext = fileName.split('.').pop()?.toLowerCase();
  return CONTENT_TYPE_MAP[ext || ''] || 'application/octet-stream';
};

/** 判断 S3/R2 错误是否为「对象不存在」（HEAD 幂等检查用）。 */
export const is404 = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  const e = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e.name === 'NoSuchKey' || e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404;
};

export class R2ImageUploader {
  private client: S3Client;
  private bucket: string;
  private publicDomain: string;
  private label: string;

  constructor() {
    const { accountId, accessKeyId, secretAccessKey } = config.r2;
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'R2 图床未完整配置。必需环境变量：R2_ACCOUNT_ID、R2_ACCESS_KEY_ID、R2_SECRET_ACCESS_KEY',
      );
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    this.bucket = config.r2.bucket;
    this.publicDomain = config.r2.publicDomain.replace(/\/$/, '');
    this.label = config.r2.label;
  }

  /**
   * 上传已下载（可压缩）的图片字节到 R2（内容寻址、幂等）。
   * 若 key 已存在则 HEAD 跳过，保证同月内重复执行不产生重复对象。
   */
  async uploadBuffer(
    buffer: Buffer,
    ext: string,
    pageId: string,
    contentTypeFallback?: string,
  ): Promise<ImageUploadResult> {
    const key = composeNewImageKey(this.label, pageId, buffer, ext);
    const publicUrl = `${this.publicDomain}/${key}`;

    const head = await this.headObject(key);
    if (head) {
      logger.info({ key, size: head.size ?? 0 }, 'R2 已存在同名对象，跳过上传');
      return { url: publicUrl, fileName: key, size: head.size ?? 0 };
    }

    const contentType = getContentType(key, contentTypeFallback);
    logger.info({ key, size: (buffer.length / 1024).toFixed(2) + 'KB' }, '正在上传到 R2');
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    logger.info({ key, size: buffer.length, url: publicUrl }, 'R2 上传完成');
    return { url: publicUrl, fileName: key, size: buffer.length };
  }

  /** HEAD 探测对象是否存在；不存在（404）返回 null，其余错误向上抛出。 */
  private async headObject(key: string): Promise<{ size?: number } | null> {
    try {
      const res = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { size: res.ContentLength };
    } catch (error) {
      if (is404(error)) return null;
      throw error;
    }
  }
}

/** 创建 R2 图片上传器实例（构造时即校验环境变量）。 */
export const createR2Uploader = (): R2ImageUploader => new R2ImageUploader();
