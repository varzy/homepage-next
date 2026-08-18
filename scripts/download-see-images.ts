#!/usr/bin/env tsx
/**
 * Step 1 下载：把迁移涉及的全部 s.ee 图片下载到本地缓存。
 *
 * 下载集 = content.prod 正文 s.ee URL ∪ taste cover frontmatter s.ee URL ∪ 线上页面级 cover/icon s.ee URL。
 *   - content.prod 覆盖所有「可配对页」的正文图片与 taste cover（迁移前快照，位置真源）。
 *   - 页面级 cover/icon 不被 fetcher 写入 .md，故扫描线上 Notion 补齐，确保迁移无 s.ee 残留。
 *
 * 本地缓存路径 = tmp/see-cache/<legacyKey>，与 R2 key 一致，Step 2 直接映射、无需重命名。
 * 幂等：文件已存在且 size>0 则跳过。失败（404/超时）写 _failures.json，不中断，可重跑补失败项。
 *
 * 用法：
 *   pnpm migrate:download
 *   pnpm migrate:download -- --only taste
 *   pnpm migrate:download -- --limit 10
 *   pnpm migrate:download -- --skip-live-covers   # 跳过线上 cover/icon 扫描（仅扫 content.prod）
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import {
  MIGRATION_TARGETS,
  selectTargets,
  parseMigrationArgs,
  createNotionClient,
  queryAllPages,
  scanContentProd,
  extractImageUrls,
  legacyKeyFromSeeUrl,
  fileEntryUrl,
  isSmmsUrl,
  delay,
} from './r2-migration-utils';

const CACHE_ROOT = path.resolve(process.cwd(), 'tmp/see-cache');
const CONCURRENCY = 3;
const USER_AGENT = 'Mozilla/5.0 (compatible; NotionImageMigration/1.0)';

interface DownloadResult {
  url: string;
  ok: boolean;
  status: string;
  bytes?: number;
}

async function downloadOne(url: string): Promise<DownloadResult> {
  const dest = path.join(CACHE_ROOT, legacyKeyFromSeeUrl(url));
  try {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 0) {
      return { url, ok: true, status: 'skipped', bytes: fs.statSync(dest).size };
    }
  } catch {
    // stat 失败则继续尝试下载
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  try {
    const res = await fetch(url, { cache: 'no-cache', headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) {
      return { url, ok: false, status: `http_${res.status}` };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length === 0) {
      return { url, ok: false, status: 'empty_body' };
    }
    fs.writeFileSync(dest, buf);
    return { url, ok: true, status: 'downloaded', bytes: buf.length };
  } catch (e) {
    return { url, ok: false, status: e instanceof Error ? e.message : String(e) };
  }
}

/** 简单并发池：最多 concurrency 个 worker 同时跑。 */
async function runPool<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
  concurrency: number,
): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await worker(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

/** 扫描线上页面级 cover/icon 的 s.ee URL（fetcher 不写入 .md，需直接查 Notion）。 */
async function collectLiveCoverIconUrls(): Promise<string[]> {
  const notion = createNotionClient();
  const out: string[] = [];
  for (const target of MIGRATION_TARGETS) {
    const dbId = process.env[target.dbIdEnv];
    if (!dbId) continue;
    let pages: PageObjectResponse[];
    try {
      pages = await queryAllPages(notion, dbId);
    } catch (e) {
      console.warn(
        `  ⚠️  扫描 ${target.label} cover/icon 失败：${e instanceof Error ? e.message : String(e)}`,
      );
      continue;
    }
    for (const page of pages) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cover = fileEntryUrl((page as any).cover);
      if (cover && isSmmsUrl(cover)) out.push(cover);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const icon = fileEntryUrl((page as any).icon);
      if (icon && isSmmsUrl(icon)) out.push(icon);
    }
    await delay(100);
  }
  return out;
}

async function main() {
  const argv = process.argv.slice(2);
  const skipLiveCovers = argv.includes('--skip-live-covers');
  const args = parseMigrationArgs(argv);
  const targets = selectTargets(args);

  console.log('━'.repeat(60));
  console.log('📥 下载 s.ee 图片到本地缓存');
  console.log('━'.repeat(60));
  console.log(`缓存目录：${CACHE_ROOT}`);

  // 1. content.prod 扫描（正文图片 + taste cover frontmatter）
  const urlSet = new Set<string>();
  for (const target of targets) {
    const contentProd = scanContentProd(target.contentProdDir);
    for (const entry of contentProd.values()) {
      for (const u of extractImageUrls(entry.body)) {
        if (isSmmsUrl(u)) urlSet.add(u);
      }
      if (entry.coverUrl && isSmmsUrl(entry.coverUrl)) urlSet.add(entry.coverUrl);
    }
  }
  console.log(`content.prod s.ee URL：${urlSet.size} 张`);

  // 2. 线上页面级 cover/icon 扫描（fetcher 不写入 .md 的部分）
  if (!skipLiveCovers) {
    console.log('扫描线上页面级 cover/icon ...');
    const liveUrls = await collectLiveCoverIconUrls();
    let added = 0;
    for (const u of liveUrls) {
      if (!urlSet.has(u)) {
        urlSet.add(u);
        added++;
      }
    }
    console.log(`线上 cover/icon s.ee：${liveUrls.length} 张（新增 ${added}）`);
  }

  let urls = [...urlSet];
  if (args.limit) urls = urls.slice(0, args.limit);
  console.log(`待下载（去重）：${urls.length} 张`);

  fs.mkdirSync(CACHE_ROOT, { recursive: true });

  const results = await runPool(urls, downloadOne, CONCURRENCY);

  const ok = results.filter((r) => r.ok);
  const failed = results.filter((r) => !r.ok);
  const downloaded = ok.filter((r) => r.status === 'downloaded').length;
  const skipped = ok.filter((r) => r.status === 'skipped').length;

  if (failed.length > 0) {
    const failPath = path.join(CACHE_ROOT, '_failures.json');
    fs.writeFileSync(failPath, JSON.stringify(failed, null, 2));
    console.warn(`\n⚠️  ${failed.length} 张下载失败，详见 ${failPath}`);
    for (const r of failed.slice(0, 20)) {
      console.warn(`   ${r.status}  ${r.url}`);
    }
    if (failed.length > 20) console.warn(`   ... 还有 ${failed.length - 20} 条`);
  }

  console.log(
    `\n✅ 完成：下载 ${downloaded}，跳过 ${skipped}，失败 ${failed.length}（共 ${urls.length}）`,
  );
  if (failed.length > 0) {
    console.log('可重跑补失败项：pnpm migrate:download');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('💥 Download failed:', error);
  process.exit(1);
});
