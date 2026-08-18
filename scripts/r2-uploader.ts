import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { ImageUploader, ImageUploadResult } from './image-uploader';
import { isSmmsUrl } from './smms-uploader';

/**
 * Cloudflare R2 图片上传实现（基于 S3 兼容 API）。
 *
 * 环境变量：
 * - R2_ACCOUNT_ID
 * - R2_ACCESS_KEY_ID
 * - R2_SECRET_ACCESS_KEY
 * - R2_BUCKET_NAME
 * - R2_PUBLIC_DOMAIN  绑定到 bucket 的自定义域名，如 https://img.varzy.me
 * - R2_KEY_PREFIX  对象在 bucket 下的目录前缀，默认 images
 */

const normalizeDomain = (raw: string): string => {
  const withProto = raw.startsWith('http') ? raw : `https://${raw}`;
  return new URL(withProto).host.replace(/\/$/, '');
};

const getR2Hosts = (): string[] => {
  const raw = process.env.R2_PUBLIC_DOMAIN;
  if (!raw) return [];
  return [normalizeDomain(raw)];
};

/**
 * 判断 URL 是否指向 R2 自定义域名。
 */
export const isR2Url = (url: string): boolean => {
  return getR2Hosts().some((h) => url.includes(h));
};

/**
 * 组合 R2 对象 key：在 R2_KEY_PREFIX（默认 images）目录下拼接文件名。
 * 前缀首尾的斜杠会被清理；空前缀时直接使用文件名。
 */
export const composeR2Key = (fileName: string): string => {
  const prefix = (process.env.R2_KEY_PREFIX ?? 'images').replace(/^\/+|\/+$/g, '');
  return prefix ? `${prefix}/${fileName}` : fileName;
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

/**
 * 根据文件扩展名推断 Content-Type，可选传入下载响应的 content-type 作为优先值。
 */
export const getContentType = (fileName: string, fallback?: string): string => {
  if (fallback) {
    const base = fallback.split(';')[0].trim();
    if (base.startsWith('image/')) return base;
  }
  const ext = fileName.split('.').pop()?.toLowerCase();
  return CONTENT_TYPE_MAP[ext || ''] || 'application/octet-stream';
};

/**
 * 判断 S3/R2 错误是否为「对象不存在」（HEAD 幂等检查用）。
 * AWS S3 抛 NoSuchKey，Cloudflare R2 抛 NotFound；两者 $metadata.httpStatusCode 均为 404。
 */
export const is404 = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  const e = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return e.name === 'NoSuchKey' || e.name === 'NotFound' || e.$metadata?.httpStatusCode === 404;
};

/**
 * 从环境变量构造共享 R2 S3 客户端（与 R2ImageUploader 同组配置）。
 * 供迁移脚本中需要 list/head/put/delete 的场景复用，避免在每个脚本重复配置。
 * 必需 env：R2_ACCOUNT_ID、R2_ACCESS_KEY_ID、R2_SECRET_ACCESS_KEY。
 */
export function createR2S3Client(): S3Client {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2 S3 client is not fully configured. Required env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY',
    );
  }
  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/**
 * 当前 R2 桶名（env R2_BUCKET_NAME），缺失时抛错。
 */
export function getR2Bucket(): string {
  const bucket = process.env.R2_BUCKET_NAME;
  if (!bucket) {
    throw new Error('Missing required environment variable: R2_BUCKET_NAME');
  }
  return bucket;
}

class R2ImageUploader implements ImageUploader {
  private client: S3Client;
  private bucket: string;
  private publicDomain: string;

  constructor() {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucket = process.env.R2_BUCKET_NAME;
    const publicDomainRaw = process.env.R2_PUBLIC_DOMAIN;

    if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicDomainRaw) {
      throw new Error(
        'R2 image uploader is not fully configured. Required env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN',
      );
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    this.bucket = bucket;
    this.publicDomain = publicDomainRaw.replace(/\/$/, '');
  }

  async uploadExternal(url: string, fileName: string): Promise<ImageUploadResult> {
    return this.fetchAndPut(url, fileName);
  }

  async uploadExternalIdempotent(url: string, fileName: string): Promise<ImageUploadResult> {
    const key = composeR2Key(fileName);
    const expectedUrl = `${this.publicDomain}/${key}`;

    const head = await this.headObject(key);
    if (head) {
      console.log(`✅ Already on R2, skip upload: ${key}`);
      return { url: expectedUrl, fileName: key, size: head.size ?? 0 };
    }

    return this.fetchAndPut(url, fileName);
  }

  /**
   * 下载外部图片并 PutObject 到 R2（不含存在性检查）。
   */
  private async fetchAndPut(url: string, fileName: string): Promise<ImageUploadResult> {
    console.log(`📥 Downloading image: ${url}`);

    const res = await fetch(url, {
      cache: 'no-cache',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NotionImageUploader/1.0)',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to download image: ${res.status} ${res.statusText}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    const contentType = getContentType(fileName, res.headers.get('content-type') || undefined);

    const key = composeR2Key(fileName);
    console.log(`📤 Uploading to R2: ${key} (${(buffer.length / 1024).toFixed(2)}KB)`);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    const publicUrl = `${this.publicDomain}/${key}`;
    return { url: publicUrl, fileName: key, size: buffer.length };
  }

  /**
   * HEAD 探测对象是否存在；不存在（404）返回 null，其余错误向上抛出。
   */
  private async headObject(key: string): Promise<{ size?: number } | null> {
    try {
      const res = await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return { size: res.ContentLength };
    } catch (error) {
      if (is404(error)) return null;
      throw error;
    }
  }

  isHostedUrl(url: string): boolean {
    // 过渡期：R2 与历史 SMMS 链接都视为已托管，避免重复上传。
    // 完成 SMMS→R2 批量迁移（迁移文档「阶段二」）且 Notion 中无 SMMS 链接残留后，
    // 可移除 isSmmsUrl 子句。
    return isR2Url(url) || isSmmsUrl(url);
  }
}

/**
 * 创建 R2 图片上传器实例（构造时即校验环境变量）。
 */
export const r2ImageUploader = (): ImageUploader => new R2ImageUploader();
