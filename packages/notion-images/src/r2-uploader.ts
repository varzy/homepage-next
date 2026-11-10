import { createHash } from 'node:crypto';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

/**
 * Cloudflare R2 图片上传（基于 S3 兼容 API），homepage-next 与 no2tg2 共用。
 *
 * 上传 key 采用内容寻址、按页分组：
 *   public/{year}/{month}/{label}/{pageId}/{sha1(bytes)[:16]}.{ext}
 * 同页同图自然幂等（上传前 HEAD 跳过），可安全重复执行。
 *
 * 敏感凭据走环境变量：R2_ACCOUNT_ID、R2_ACCESS_KEY_ID、R2_SECRET_ACCESS_KEY
 * （也可通过构造参数注入）。桶名与公开域名不敏感，走默认值。
 */

/** R2 桶名（不敏感，写死）。 */
const DEFAULT_BUCKET = 'homepage';
/** 绑定到 R2 桶的自定义域名（图片公开访问域名，不敏感，写死）。 */
const DEFAULT_PUBLIC_DOMAIN = 'https://cdn.varzy.me';

export interface R2UploaderOptions {
  accountId?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket?: string;
  publicDomain?: string;
}

interface ImageUploadResult {
  /** 上传后的公开访问 URL */
  url: string;
  /** 存储到 R2 的对象 key */
  fileName: string;
}

/**
 * 从 URL 提取扩展名（不含点、小写）；无法识别时回退 'jpg'。
 * 用于识别以前上传的 HEIC 外链。
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
export const isR2Url = (url: string, publicDomain: string = DEFAULT_PUBLIC_DOMAIN): boolean => {
  try {
    return new URL(url).host === new URL(publicDomain).host;
  } catch {
    return false;
  }
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

  constructor(opts: R2UploaderOptions = {}) {
    const accountId = opts.accountId ?? process.env.R2_ACCOUNT_ID;
    const accessKeyId = opts.accessKeyId ?? process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = opts.secretAccessKey ?? process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'R2 image uploader is not fully configured. Required env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY',
      );
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
    this.bucket = opts.bucket ?? DEFAULT_BUCKET;
    this.publicDomain = (opts.publicDomain ?? DEFAULT_PUBLIC_DOMAIN).replace(/\/$/, '');
  }

  /**
   * 上传压缩后的图片字节到 R2（内容寻址、幂等）。
   * 若 key 已存在则 HEAD 跳过，保证同月内重复执行不产生重复对象。
   */
  async uploadBuffer(
    buffer: Buffer,
    ext: string,
    label: string,
    pageId: string,
    contentType: string,
  ): Promise<ImageUploadResult> {
    const key = composeNewImageKey(label, pageId, buffer, ext);
    const publicUrl = `${this.publicDomain}/${key}`;

    if (await this.objectExists(key)) {
      console.log(`✅ Already on R2, skip upload: ${key}`);
      return { url: publicUrl, fileName: key };
    }

    console.log(`📤 Uploading to R2: ${key} (${(buffer.length / 1024).toFixed(2)}KB)`);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return { url: publicUrl, fileName: key };
  }

  /** HEAD 探测对象是否存在，404 以外的错误向上抛出。 */
  private async objectExists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch (error) {
      if (is404(error)) return false;
      throw error;
    }
  }
}
