#!/usr/bin/env tsx

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { DeleteObjectsCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { Client } from '@notionhq/client';
import { BlockObjectResponse, PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { r2KeyFromUrl } from './r2-migration-utils';

/**
 * 清理 R2 孤儿对象：删除 R2_KEY_PREFIX 前缀下、其对象 key 未被任何 Notion 页面
 * （图片块 / cover / files 属性）引用的对象。
 *
 * 背景：失败的 migrate-smms-to-r2 在 R2 上留下了一批未被引用的对象（迁移回退后
 * Notion 已全部指向 s.ee）。此外可能存在早期 fetch 流程上传后又被回退的孤儿。
 *
 * 安全（核心）：
 * - 引用集按「对象 key」比对（剥 host，域名无关——cdn/img 均可），避免多域误判。
 * - 优先消费 rewrite 产出的引用集 tmp/post-migration-references.json（全量覆盖时零 Notion 读）；
 *   无缓存或不全时退化回 Notion 全量扫描。仅未覆盖的页才补读。
 * - 默认 dry-run，仅打印待删清单。--apply 才真正删除。
 * - 仅扫描 R2_KEY_PREFIX 前缀下的对象（legacy/ 不在范围，绝不会被删）。
 *
 * 用法：
 *   pnpm cleanup:r2              # dry-run，列出孤儿
 *   pnpm cleanup:r2 -- --apply   # 真正删除
 */

const DELETE_BATCH = 1000;
const REFSET_PATH = path.resolve(process.cwd(), 'tmp/post-migration-references.json');
const ALL_TARGETS = ['posts', 'kotoba', 'taste', 'pages'];

const DATABASE_IDS = [
  process.env.NOTION_POSTS_DATABASE_ID,
  process.env.NOTION_KOTOBA_DATABASE_ID,
  process.env.NOTION_TASTE_DATABASE_ID,
  process.env.NOTION_PAGES_DATABASE_ID,
].filter((id): id is string => Boolean(id));

interface RefSet {
  allPagesCovered: boolean;
  queriedTargets: string[];
  keys: string[];
  coveredPageIds: string[];
  uncoveredPageIds: string[];
}

function loadRefSet(): RefSet | null {
  if (!fs.existsSync(REFSET_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(REFSET_PATH, 'utf-8')) as RefSet;
  } catch {
    return null;
  }
}

function allFourQueried(queried: string[]): boolean {
  return ALL_TARGETS.every((t) => queried.includes(t));
}

/** 把一批公开 URL 转 key 后并入引用集（s.ee 等非 R2 域自动跳过）。 */
function addKeys(set: Set<string>, urls: string[]): void {
  for (const u of urls) {
    const k = r2KeyFromUrl(u);
    if (k) set.add(k);
  }
}

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
  const prefix = (process.env.R2_KEY_PREFIX ?? 'images').replace(/^\/+|\/+$/g, '');

  if (!notionApiSecret) throw new Error('NOTION_API_SECRET missing');
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      'R2 env missing. Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME',
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

  // 1. 构建权威引用集（按 R2 对象 key 比对，域名无关）。
  //    优先消费 rewrite 产出的引用集 tmp/post-migration-references.json：
  //    - 全量覆盖（allPagesCovered）且四库都查过 → 直接用缓存 keys，零 Notion 读；
  //    - 四库都查过但有未覆盖页 → 用缓存 keys + 仅对 uncoveredPageIds 补读（pages.retrieve）；
  //    - 无缓存或不全 → 退化回 Notion 全量扫描（4 库 queryAllPages + 逐页块遍历）。
  const referenced = new Set<string>();
  const refset = loadRefSet();
  let referencedSource = 'notion-full-scan';
  if (refset && allFourQueried(refset.queriedTargets)) {
    // refset.keys 已是 R2 对象 key（rewrite 用 r2KeyFromUrl 提取过），直接入集，勿再转。
    for (const k of refset.keys) referenced.add(k);
    if (refset.allPagesCovered) {
      referencedSource = 'refset-cached (全量覆盖，零 Notion 读)';
      console.log(`📦 引用集来自缓存（rewrite 全量覆盖）：${referenced.size} 个 key`);
    } else {
      referencedSource = `refset-cached (${refset.keys.length} key) + 补读 ${refset.uncoveredPageIds.length} 个未覆盖页`;
      console.log(
        `📦 引用集：缓存 ${refset.keys.length} key + 补读未覆盖页 ${refset.uncoveredPageIds.length} 个`,
      );
      // 未覆盖页需现读 Notion（返回公开 URL，经 addKeys 转 key）。
      for (const pid of refset.uncoveredPageIds) {
        try {
          const page = (await notion.pages.retrieve({ page_id: pid })) as PageObjectResponse;
          addKeys(referenced, collectPageUrls(page));
          addKeys(referenced, await collectBlockImageUrls(notion, pid));
        } catch (e) {
          console.warn(
            `  ⚠️  补读页面 ${pid.slice(0, 8)}… 失败：${e instanceof Error ? e.message : String(e)}`,
          );
        }
      }
    }
  } else {
    if (refset) {
      console.warn(
        `⚠️  引用集缓存不全（queriedTargets=${refset.queriedTargets.join(',') || '(空)'}），退化回 Notion 全量扫描`,
      );
    } else {
      console.log('ℹ️  无引用集缓存，走 Notion 全量扫描');
    }
    for (const dbId of DATABASE_IDS) {
      const pages = await queryAllPages(notion, dbId);
      console.log(`📚 扫描库 ${dbId.slice(0, 8)}…：${pages.length} 页`);
      for (const page of pages) {
        addKeys(referenced, collectPageUrls(page));
        addKeys(referenced, await collectBlockImageUrls(notion, page.id));
      }
    }
  }
  console.log(`🔗 引用集：${referenced.size} 个 key（来源：${referencedSource}）\n`);

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

  // 3. 分类（按对象 key 比对，与引用集一致，域名无关）
  const orphans: string[] = [];
  const kept: string[] = [];
  for (const key of allKeys) {
    if (referenced.has(key)) kept.push(key);
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
