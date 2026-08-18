#!/usr/bin/env tsx

import 'dotenv/config';
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { Client } from '@notionhq/client';
import { BlockObjectResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';

/**
 * 清理 R2 孤儿对象：删除 R2_KEY_PREFIX 前缀下、其公开 URL 未被任何 Notion 页面
 * （图片块 / cover / files 属性）引用的对象。
 *
 * 背景：失败的 migrate-smms-to-r2 在 R2 上留下了一批未被引用的对象（迁移回退后
 * Notion 已全部指向 s.ee）。此外可能存在早期 fetch 流程上传后又被回退的孤儿。
 *
 * 安全（核心）：
 * - 引用集直接来自 Notion（4 个库的全部页面：图片块 + cover + files 属性），
 *   而非本地 .md——.md 对 files 属性（如 taste 的 cover）覆盖不全，曾导致漏判。
 *   任何被 Notion 引用的 R2 对象都会被保留。
 * - 默认 dry-run，仅打印待删清单。--apply 才真正删除。
 * - 仅扫描 R2_KEY_PREFIX 前缀下的对象。
 *
 * 用法：
 *   pnpm cleanup:r2              # dry-run，列出孤儿
 *   pnpm cleanup:r2 -- --apply   # 真正删除
 */

const DELETE_BATCH = 1000;

const DATABASE_IDS = [
  process.env.NOTION_POSTS_DATABASE_ID,
  process.env.NOTION_KOTOBA_DATABASE_ID,
  process.env.NOTION_TASTE_DATABASE_ID,
  process.env.NOTION_PAGES_DATABASE_ID,
].filter((id): id is string => Boolean(id));

function fileEntryUrl(file: {
  type?: string;
  file?: { url?: string };
  external?: { url?: string };
}): string | undefined {
  if (file.type === 'file') return file.file?.url;
  if (file.type === 'external') return file.external?.url;
  return undefined;
}

/** 从页面级字段（cover / icon / files 属性）收集引用的图片 URL。 */
function collectPageUrls(page: PageObjectResponse): string[] {
  const urls: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cover = (page as any).cover;
  if (cover) {
    const u = fileEntryUrl(cover);
    if (u) urls.push(u);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const icon = (page as any).icon;
  if (icon) {
    const u = fileEntryUrl(icon);
    if (u) urls.push(u);
  }
  for (const prop of Object.values(page.properties)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = prop as any;
    if (p?.type !== 'files' || !Array.isArray(p.files)) continue;
    for (const f of p.files) {
      const u = fileEntryUrl(f);
      if (u) urls.push(u);
    }
  }
  return urls;
}

/** 递归收集所有图片块的 URL（external / file），按文档顺序。 */
async function collectBlockImageUrls(notion: Client, blockId: string): Promise<string[]> {
  const urls: string[] = [];
  const walk = async (id: string, startCursor?: string): Promise<void> => {
    const res = await notion.blocks.children.list({ block_id: id, start_cursor: startCursor });
    for (const b of res.results as BlockObjectResponse[]) {
      if (b.type === 'image') {
        const u = fileEntryUrl(b.image as unknown as Parameters<typeof fileEntryUrl>[0]);
        if (u) urls.push(u);
      }
      if (b.has_children) await walk(b.id);
    }
    if (res.has_more && res.next_cursor) await walk(id, res.next_cursor);
  };
  await walk(blockId);
  return urls;
}

async function queryAllPages(notion: Client, dataSourceId: string): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (notion as any).dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
    });
    for (const p of res.results) pages.push(p as PageObjectResponse);
    cursor = res.next_cursor || undefined;
  } while (cursor);
  return pages;
}

async function main() {
  const notionApiSecret = process.env.NOTION_API_SECRET;
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucket = process.env.R2_BUCKET_NAME;
  const publicDomain = (process.env.R2_PUBLIC_DOMAIN ?? '').replace(/\/$/, '');
  const prefix = (process.env.R2_KEY_PREFIX ?? 'images').replace(/^\/+|\/+$/g, '');

  if (!notionApiSecret) throw new Error('NOTION_API_SECRET missing');
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicDomain) {
    throw new Error(
      'R2 env missing. Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN',
    );
  }
  if (DATABASE_IDS.length === 0) throw new Error('No NOTION_*_DATABASE_ID configured');

  const apply = process.argv.slice(2).includes('--apply');
  const notion = new Client({ auth: notionApiSecret });
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  // 1. 构建权威引用集：遍历 4 个库所有页面的图片块 + cover + files 属性
  const referenced = new Set<string>();
  for (const dbId of DATABASE_IDS) {
    const pages = await queryAllPages(notion, dbId);
    console.log(`📚 扫描库 ${dbId.slice(0, 8)}…：${pages.length} 页`);
    for (const page of pages) {
      for (const u of collectPageUrls(page)) referenced.add(u);
      for (const u of await collectBlockImageUrls(notion, page.id)) referenced.add(u);
    }
  }
  console.log(`🔗 Notion 引用 URL 共 ${referenced.size} 条\n`);

  // 2. 列出 R2 前缀下全部对象
  const allKeys: string[] = [];
  let token: string | undefined;
  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix ? `${prefix}/` : undefined,
        ContinuationToken: token,
      }),
    );
    for (const o of res.Contents ?? []) {
      if (o.Key) allKeys.push(o.Key);
    }
    token = res.NextContinuationToken;
  } while (token);
  console.log(`📦 R2 对象（前缀 "${prefix}/"）：${allKeys.length} 个\n`);

  // 3. 分类
  const orphans: string[] = [];
  const kept: string[] = [];
  for (const key of allKeys) {
    const publicUrl = `${publicDomain}/${key}`;
    if (referenced.has(publicUrl)) kept.push(key);
    else orphans.push(key);
  }

  if (orphans.length) {
    console.log(`🗑  孤儿（待删，${orphans.length}）：`);
    for (const k of orphans) console.log(`   ${k}`);
  }
  if (kept.length) {
    console.log(`\n✅ 保留（被 Notion 引用，${kept.length}）：`);
    for (const k of kept) console.log(`   ${k}`);
  }

  console.log(`\n━━━ 汇总 ━━━`);
  console.log(`孤儿待删：${orphans.length}`);
  console.log(`保留（被引用）：${kept.length}`);

  if (!apply) {
    console.log('\n以上为 dry-run。确认无误后执行：pnpm cleanup:r2 -- --apply');
    return;
  }

  // 4. 批量删除（DeleteObjects 每批上限 1000）
  let deleted = 0;
  for (let i = 0; i < orphans.length; i += DELETE_BATCH) {
    const batch = orphans.slice(i, i + DELETE_BATCH).map((Key) => ({ Key }));
    await client.send(new DeleteObjectsCommand({ Bucket: bucket, Delete: { Objects: batch } }));
    deleted += batch.length;
  }
  console.log(`\n✅ 已删除 ${deleted} 个孤儿对象`);
}

main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
