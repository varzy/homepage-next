/**
 * 图片上传抽象层。
 *
 * 站点正处于图床迁移过渡期：历史图片托管在 SMMS（s.ee），新图片上传到 Cloudflare R2。
 * 通过 ImageUploader 接口将具体图床实现与 NotionImageProcessor 解耦，
 *
 * 新增图床时只需实现 ImageUploader 并在 createImageUploader 中注册即可。
 */

import { createHash } from 'node:crypto';
import { r2ImageUploader } from './r2-uploader';
import { smmsImageUploader } from './smms-uploader';

export interface ImageUploadResult {
  /** 上传后的公开访问 URL */
  url: string;
  /** 存储到图床的文件名 / key */
  fileName: string;
  /** 文件大小（字节） */
  size: number;
}

export interface ImageUploader {
  /**
   * 下载外部图片并上传到图床，返回最终公开访问 URL。
   */
  uploadExternal(url: string, fileName: string): Promise<ImageUploadResult>;
  /**
   * 与 uploadExternal 相同，但若该对象已存在于图床则直接跳过上传。
   * 用于批量迁移：保证同一来源链接重复执行不会产生重复对象。
   */
  uploadExternalIdempotent(url: string, fileName: string): Promise<ImageUploadResult>;
  /**
   * 判断 URL 是否已托管在本图床（或过渡期内的历史图床），
   * 命中则跳过重复上传。
   */
  isHostedUrl(url: string): boolean;
}

export type ImageUploaderProvider = 'r2' | 'smms';

/**
 * 当前激活的图床 provider。
 */
export function getImageUploaderProvider(): ImageUploaderProvider {
  return 'r2';
}

/**
 * 根据当前配置创建图床上传器实例。
 * 若所选 provider 的必要环境变量缺失将抛出错误（用于在抓取流程早期失败）。
 */
export function createImageUploader(): ImageUploader {
  const provider = getImageUploaderProvider();
  if (provider === 'smms') {
    return smmsImageUploader();
  }
  return r2ImageUploader();
}

/**
 * 在抓取脚本入口处校验图床配置是否就绪，并打印当前使用的 provider。
 */
export function ensureImageUploaderConfigured(): void {
  createImageUploader();
  console.log(`🖼️ Image uploader in use: ${getImageUploaderProvider()}`);
}

/**
 * 生成合适的文件名（图床无关）。
 */
export const generateFileName = (url: string, prefix: string = '', blockId?: string): string => {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');
  const originalName = pathParts[pathParts.length - 1];
  const extension = originalName.includes('.') ? originalName.split('.').pop() : 'jpg';

  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);

  if (blockId) {
    return `${prefix}_${blockId}_${timestamp}.${extension}`;
  }

  return `${prefix}_${timestamp}_${randomStr}.${extension}`;
};

/**
 * 从 URL 提取扩展名（不含点、小写）；无法识别时回退 'jpg'。
 * 仅用于生成可读 / 推断 Content-Type 的文件名后缀，实际上传时仍以响应 content-type 为准。
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
 * 为迁移生成「稳定、唯一、可读」的图床文件名（R2 key 的主体部分，不含目录前缀）。
 *
 * 格式：${prefix}_${pageId}_${hash}.${ext}（例：posts_39adc9c0-…-d56_<hash>.jpg）
 *
 * 三个不变量：
 * 1. 稳定（幂等）：同一来源链接恒等映射到同一文件名，断点续跑时上传前可 HEAD 探测
 *    跳过已上传对象，重复执行不产生重复 / 孤儿对象。
 * 2. 唯一（不折叠）：hash 取完整来源 URL 的 sha1 前 16 位——不同链接（哪怕 s.ee 对
 *    不同图复用了同一 basename、仅 URL 路径段不同）也会得到不同 hash，绝不折叠成
 *    同一对象。prefix 与 pageId 仅用于分组 / 可读性，不参与唯一性判断。
 * 3. 可读：prefix（数据库标识）+ pageId（所属 Notion 页面）让人一眼看出对象归属，
 *    并在 R2 列表中按页面聚合。
 *
 * hash 必须取**完整来源 URL**（非图片内容），否则上传前无法 HEAD 探测、幂等跳过失效。
 * 末尾保留来源扩展名（小写），便于推断 Content-Type；非法 URL 退化为对原始字符串
 * 取哈希，仍保证确定性与唯一性。prefix / pageId 为空时回退为更短的形式。
 *
 * 历史教训：此前取 pathname 末段（basename）作 key，而 s.ee 允许不同图复用同一文件名，
 * 导致多张不同图折叠到同一 R2 对象、回写后 Notion 出现重复图 / 全变第一张。
 *
 * 取舍：因 key 含 pageId，同一张图被两个页面共用时会各存一份（无跨页去重），
 * 属可接受的小幅冗余、非数据错误。
 */
export const stableFileNameFromUrl = (url: string, prefix = '', pageId = ''): string => {
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 16);
  const stem = [prefix, pageId, hash].filter(Boolean).join('_');
  return `${stem}.${extractExtension(url)}`;
};
