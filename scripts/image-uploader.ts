/**
 * 图片上传抽象层。
 *
 * 站点正处于图床迁移过渡期：历史图片托管在 SMMS（s.ee），新图片上传到 Cloudflare R2。
 * 通过 ImageUploader 接口将具体图床实现与 NotionImageProcessor 解耦，
 *
 * 新增图床时只需实现 ImageUploader 并在 createImageUploader 中注册即可。
 */

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
