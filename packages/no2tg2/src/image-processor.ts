import type { BlockObjectResponse } from '@notionhq/client';

import { compressImage } from './compress.ts';
import { logger } from './logger.ts';
import { notionClient } from './notion.ts';
import {
  createR2Uploader,
  extractExtension,
  isR2Url,
  type R2ImageUploader,
} from './r2-uploader.ts';

export interface ImageProcessingStats {
  total: number;
  processed: number;
  skipped: number;
  errors: number;
}

const UPLOAD_DELAY_MS = 100;
const HEIC_EXTS = new Set(['heic', 'heif']);

export async function processPageImages(pageId: string): Promise<ImageProcessingStats> {
  const stats: ImageProcessingStats = { total: 0, processed: 0, skipped: 0, errors: 0 };
  const uploader = createR2Uploader();
  await processBlocks(pageId, stats, uploader);
  return stats;
}

async function processBlocks(
  blockId: string,
  stats: ImageProcessingStats,
  uploader: R2ImageUploader,
  startCursor?: string,
): Promise<void> {
  const response = await notionClient.blocks.children.list({
    block_id: blockId,
    page_size: 100,
    start_cursor: startCursor,
  });

  for (const block of response.results) {
    if (!('type' in block)) continue;

    if (block.type === 'image') {
      stats.total++;
      await processImageBlock(block as BlockObjectResponse, stats, uploader);
    }

    if (block.has_children) {
      await processBlocks(block.id, stats, uploader);
    }
  }

  if (response.has_more && response.next_cursor) {
    await processBlocks(blockId, stats, uploader, response.next_cursor);
  }
}

async function processImageBlock(
  block: BlockObjectResponse,
  stats: ImageProcessingStats,
  uploader: R2ImageUploader,
): Promise<void> {
  if (block.type !== 'image') return;

  try {
    const imageBlock = block.image;
    let imageUrl: string;
    let needsUpload = false;

    if (imageBlock.type === 'file') {
      imageUrl = imageBlock.file.url;
      needsUpload = true;
    } else if (imageBlock.type === 'external') {
      imageUrl = imageBlock.external.url;
      // 历史版本曾把未能转码的 HEIC 原样传到 R2，浏览器无法显示，需重新处理
      needsUpload = !isR2Url(imageUrl) || HEIC_EXTS.has(extractExtension(imageUrl));
    } else {
      stats.skipped++;
      return;
    }

    if (!needsUpload) {
      stats.skipped++;
      return;
    }

    logger.info({ blockId: block.id, imageUrl }, '正在下载图片...');
    const downloadResponse = await fetch(imageUrl);
    if (!downloadResponse.ok) {
      throw new Error(`下载图片失败：${imageUrl}（HTTP ${downloadResponse.status}）`);
    }

    const contentType = downloadResponse.headers.get('content-type') || undefined;
    const rawBuffer = Buffer.from(await downloadResponse.arrayBuffer());

    logger.info({ blockId: block.id, imageUrl, size: rawBuffer.length, contentType }, '图片已下载');

    // 扩展名与 Content-Type 取自压缩后的实际格式（HEIC 会被转成 JPEG）
    const image = await compressImage(rawBuffer, `block ${block.id}`);

    logger.info({ blockId: block.id, ext: image.ext }, '正在上传到 R2...');
    const uploadResult = await uploader.uploadBuffer(
      image.buffer,
      image.ext,
      block.id,
      image.contentType,
    );

    logger.info({ blockId: block.id, url: uploadResult.url }, '正在更新 Notion block...');
    await notionClient.blocks.update({
      block_id: block.id,
      image: { external: { url: uploadResult.url } },
    });

    stats.processed++;
    logger.info({ blockId: block.id, url: uploadResult.url }, '图片已上传并更新');

    await new Promise((resolve) => setTimeout(resolve, UPLOAD_DELAY_MS));
  } catch (err) {
    stats.errors++;
    logger.error({ blockId: block.id, err }, '图片处理失败');
  }
}
