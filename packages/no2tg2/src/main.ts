import 'dotenv/config';
import { isR2Configured } from './config.ts';
import { formatMessage, validateMessage } from './formatter.ts';
import { processPageImages } from './image-processor.ts';
import { logger } from './logger.ts';
import { getPageContent, markAsPublished, queryReadyPage } from './notion.ts';
import { applyGlobalProxyForFetch } from './proxy.ts';
import { sendToChannel } from './telegram.ts';

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

async function release(): Promise<void> {
  logger.info('正在查询 Notion 数据库...');
  const page = await queryReadyPage();

  if (!page) {
    logger.info('没有待发布的页面');
    return;
  }

  logger.info({ title: page.title, createdDate: page.createdTime.slice(0, 10) }, '找到待发布页面');

  if (isR2Configured()) {
    logger.info('正在处理页面图片...');
    const imageStats = await processPageImages(page.id);
    logger.info(
      {
        total: imageStats.total,
        processed: imageStats.processed,
        skipped: imageStats.skipped,
        errors: imageStats.errors,
      },
      '图片处理完成',
    );
  } else {
    logger.warn('R2 图床未完整配置，跳过图片处理');
  }

  logger.info('正在获取页面内容...');
  const content = await getPageContent(page.id);

  logger.info(
    { paragraphs: content.paragraphs.length, images: content.imageUrls.length },
    '内容提取完成',
  );
  if (content.paragraphs.length === 0) {
    logger.warn('页面正文为空，已跳过发布');
    return;
  }

  const message = formatMessage(content.paragraphs, {
    tags: page.tags,
    withTitle: page.withTitle,
    title: page.title,
    titleUrl: page.titleUrl,
  });
  validateMessage(message, content.imageUrls.length > 0);

  logger.info(
    { imageCount: content.imageUrls.length, messageLength: message.length },
    '正在发送到 Telegram...',
  );
  await sendToChannel(message, content.imageUrls);
  logger.info('发送成功！');

  logger.info('正在更新 Notion 状态...');
  try {
    await markAsPublished(page.id);
    logger.info({ title: page.title }, '完成！页面已发布');
  } catch (error) {
    logger.error({ error: formatError(error) }, '消息已发出，但 Notion 状态更新失败');
    logger.error('请手动将该页面标记为 Published 并填写 PublishDate');
    throw error;
  }
}

async function runOnce(): Promise<void> {
  try {
    logger.info(
      { r2Configured: isR2Configured(), node: process.version, pid: process.pid },
      'no2tg2 启动',
    );
    const activeProxy = applyGlobalProxyForFetch();
    if (activeProxy) {
      logger.info({ proxy: activeProxy }, '已启用全局代理');
    }
    await release();
  } catch (error) {
    logger.error({ error: formatError(error) }, '发布失败');
    process.exitCode = 1;
  }
}

void runOnce();
