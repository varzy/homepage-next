#!/usr/bin/env tsx

import 'dotenv/config';
import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionImageProcessor } from './image-processor';
import { ensureImageUploaderConfigured } from './image-uploader';
import { getTextProperty } from './utils';

/**
 * 方案 B：将四个 Notion 数据库中引用的 s.ee（SMMS）图片全部迁移到 Cloudflare R2。
 *
 * 对每个页面的每个 s.ee 图片（内容块 + files 属性）执行：
 *   下载 → 上传 R2 → 将 R2 链接回写到原 Notion 块/属性。
 *
 * 幂等性：
 * 1. Notion 级——已迁移为 R2 链接的图片不再命中 isSmmsUrl，重跑自动跳过；
 * 2. R2 级——同一 s.ee 链接经 stableFileNameFromUrl 得到稳定且唯一的 R2 key，
 *    上传前先 HEAD 探测，已存在则跳过，避免崩溃续跑时产生重复/孤儿对象。
 *
 * 用法：
 *   pnpm migrate:smms                  # 全量迁移
 *   pnpm migrate:smms -- --only taste  # 仅迁移 taste 数据库
 *   pnpm migrate:smms -- --limit 3     # 每个数据库只处理前 3 个页面（试跑）
 *
 * 注意：迁移完成后请运行 `pnpm fetch:all` 重新生成 markdown，使内容中的图片链接更新为 R2。
 */
interface MigrationTarget {
  label: string;
  databaseId: string;
  imagePrefix: string;
  getIdentifier: (page: PageObjectResponse) => string;
}

const TARGETS: MigrationTarget[] = [
  {
    label: 'posts',
    databaseId: process.env.NOTION_POSTS_DATABASE_ID ?? '',
    imagePrefix: 'posts',
    getIdentifier: (p) => getTextProperty(p.properties.slug) || p.id,
  },
  {
    label: 'kotoba',
    databaseId: process.env.NOTION_KOTOBA_DATABASE_ID ?? '',
    imagePrefix: 'kotoba',
    getIdentifier: (p) => p.id.replace(/-/g, '').slice(0, 8),
  },
  {
    label: 'taste',
    databaseId: process.env.NOTION_TASTE_DATABASE_ID ?? '',
    imagePrefix: 'taste',
    getIdentifier: (p) => p.id.replace(/-/g, '').slice(0, 8),
  },
  {
    label: 'pages',
    databaseId: process.env.NOTION_PAGES_DATABASE_ID ?? '',
    imagePrefix: 'pages',
    getIdentifier: (p) => getTextProperty(p.properties.slug) || p.id,
  },
];

async function queryAllPages(notion: Client, dataSourceId: string): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = [];
  let startCursor: string | undefined;
  do {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (notion as any).dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: startCursor,
    });
    for (const page of res.results) {
      pages.push(page as PageObjectResponse);
    }
    startCursor = res.next_cursor || undefined;
    console.log(`  loaded ${pages.length} pages so far...`);
  } while (startCursor);
  return pages;
}

function parseArgs(argv: string[]): { only: string; limit: number | undefined } {
  const onlyIdx = argv.indexOf('--only');
  const only = onlyIdx >= 0 && argv[onlyIdx + 1] ? argv[onlyIdx + 1].trim() : '';

  let limit: number | undefined;
  const limitIdx = argv.indexOf('--limit');
  if (limitIdx >= 0 && argv[limitIdx + 1]) {
    const n = Number(argv[limitIdx + 1]);
    if (Number.isFinite(n) && n > 0) limit = n;
  }
  return { only, limit };
}

async function main() {
  const notionApiSecret = process.env.NOTION_API_SECRET;
  if (!notionApiSecret) {
    throw new Error('Missing required environment variable: NOTION_API_SECRET');
  }
  ensureImageUploaderConfigured();

  const { only, limit } = parseArgs(process.argv.slice(2));
  const notion = new Client({ auth: notionApiSecret });

  const totals = { pages: 0, processed: 0, skipped: 0, errors: 0 };

  for (const target of TARGETS) {
    if (only && target.label !== only) continue;
    if (!target.databaseId) {
      console.warn(`⚠️  Skip "${target.label}": database id not configured`);
      continue;
    }

    console.log(`\n━━━ Migrating ${target.label} ━━━`);
    const pages = await queryAllPages(notion, target.databaseId);
    const slice = limit ? pages.slice(0, limit) : pages;
    console.log(
      `found ${pages.length} ${target.label} pages${limit ? `, processing first ${slice.length}` : ''}`,
    );

    // 每个数据库独立的上传器实例（imagePrefix 仅用于日志/常规命名，迁移走稳定 basename）
    const processor = new NotionImageProcessor(notionApiSecret, target.imagePrefix);

    for (const page of slice) {
      totals.pages++;
      const identifier = target.getIdentifier(page);
      console.log(`\n▸ ${target.label}/${identifier} (${page.id})`);
      try {
        await processor.migratePageFileProperties(page, identifier);
        const stats = await processor.migratePageImages(page.id, identifier);
        totals.processed += stats.processed;
        totals.skipped += stats.skipped;
        totals.errors += stats.errors;
      } catch (error) {
        totals.errors++;
        console.error(`❌ Failed to migrate page ${page.id}:`, error);
      }
    }
  }

  console.log(`\n━━━ Migration summary ━━━`);
  console.log(`Pages scanned  : ${totals.pages}`);
  console.log(`Images migrated: ${totals.processed}`);
  console.log(`Images skipped : ${totals.skipped}`);
  console.log(`Errors         : ${totals.errors}`);
  console.log(
    totals.errors > 0
      ? '\n⚠️  有错误发生 —— 重新运行脚本即可重试失败项（已迁移的图片会被跳过）。'
      : '\n✅ 迁移完成。请运行 `pnpm fetch:all` 重新生成 markdown，使图片链接更新为 R2。',
  );
  process.exit(totals.errors > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
