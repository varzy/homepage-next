import type { Agent } from 'node:http';
import { Telegraf } from 'telegraf';
import type { Context } from 'telegraf';

import { compressImage } from './compress.ts';
import { config } from './config.ts';
import { logger } from './logger.ts';
import { createNodeProxyAgent, resolveProxyUrl } from './proxy.ts';

export type TelegramApi = Pick<
  Telegraf<Context>['telegram'],
  'sendMessage' | 'sendPhoto' | 'sendMediaGroup'
>;

type UploadPhoto = Exclude<Parameters<TelegramApi['sendPhoto']>[1], string>;

interface FetchLike {
  (input: string | URL, init?: RequestInit): Promise<Response>;
}

export function createTelegramProxyAgent(env: NodeJS.ProcessEnv = process.env): Agent | null {
  return createNodeProxyAgent(env);
}

export function createBot(): Telegraf<Context> {
  const proxyAgent = createTelegramProxyAgent();
  if (!proxyAgent) {
    return new Telegraf<Context>(config.telegram.botToken);
  }

  const activeProxy = resolveProxyUrl();
  logger.info({ proxy: activeProxy ?? '<unknown>' }, '已启用 Telegram 代理');

  return new Telegraf<Context>(config.telegram.botToken, {
    telegram: {
      // Route bot API calls through proxy to avoid regional network timeouts.
      agent: proxyAgent,
      attachmentAgent: proxyAgent,
    },
  });
}

async function downloadImageForUpload(
  url: string,
  index: number,
  fetcher: FetchLike,
): Promise<UploadPhoto> {
  const response = await fetcher(url);
  if (!response.ok) {
    throw new Error(`下载图片失败：${url}（HTTP ${response.status}）`);
  }

  const originalBuffer = Buffer.from(await response.arrayBuffer());

  logger.info({ index, url, size: originalBuffer.length }, '图片已下载');

  // 压缩与失败回退策略由 compressImage 统一处理；文件名扩展名与实际格式保持一致。
  const image = await compressImage(originalBuffer, `telegram #${index + 1}`);
  const filename = `notion-image-${index + 1}.${image.ext}`;

  logger.info({ index, url, uploadSize: image.buffer.length, filename }, '图片准备上传 Telegram');

  return {
    source: image.buffer,
    filename,
  } as UploadPhoto;
}

export async function sendToChannel(
  text: string,
  imageUrls: string[],
  api: TelegramApi = createBot().telegram,
  fetcher: FetchLike = fetch,
): Promise<void> {
  if (imageUrls.length === 0) {
    logger.info({ messageLength: text.length }, '无图片，使用 sendMessage 发送纯文本');
    await api.sendMessage(config.telegram.chatId, text, { parse_mode: 'MarkdownV2' });
    return;
  }

  if (imageUrls.length === 1) {
    logger.info({ imageCount: 1, messageLength: text.length }, '单图，使用 sendPhoto 发送');
    const upload = await downloadImageForUpload(imageUrls[0], 0, fetcher);
    await api.sendPhoto(config.telegram.chatId, upload, {
      caption: text,
      parse_mode: 'MarkdownV2',
    });
    return;
  }

  if (imageUrls.length <= 10) {
    logger.info(
      { imageCount: imageUrls.length, messageLength: text.length },
      '多图，使用 sendMediaGroup 发送',
    );
    const uploads = await Promise.all(
      imageUrls.map((url, index) => downloadImageForUpload(url, index, fetcher)),
    );
    const mediaGroup: Parameters<TelegramApi['sendMediaGroup']>[1] = uploads.map(
      (upload, index) => {
        if (index === 0) {
          return {
            type: 'photo',
            media: upload,
            caption: text,
            parse_mode: 'MarkdownV2',
          };
        }

        return {
          type: 'photo',
          media: upload,
        };
      },
    );

    await api.sendMediaGroup(config.telegram.chatId, mediaGroup);
    return;
  }

  throw new Error(`图片数量超过 Telegram 限制：${imageUrls.length}（最多 10 张）`);
}
