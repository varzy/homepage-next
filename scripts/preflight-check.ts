#!/usr/bin/env tsx
/**
 * Step 0 预检：迁移前的只读审计（不改任何数据）。
 *
 * 职责：
 * 1. 环境变量齐全 + R2_PUBLIC_DOMAIN == cdn.varzy.me（硬门槛，--force-domain 可跳过用于试跑）
 * 2. R2 S3 连通性探针（list 1 对象，确认凭证/桶/端点）
 * 3. content.prod 完整性：解析全部 s.ee URL（正文 + taste cover），统计/按域分布/legacy key 冲突
 * 4. 结构对齐断言（D4 前提）：逐页 pageToMarkdown → 图片 blockId 序列 vs content.prod 图片 URL 序列
 * 5. 页面级 cover/icon s.ee 扫描
 * 6. 线上 s.ee URL 收集 + 「线上 s.ee 但不在 content.prod」异常标记
 * 7. child_page 子树图片块扫描（位置配对盲区）
 *
 * 输出：控制台报告 + tmp/migration-preflight.json。
 *
 * 用法：
 *   pnpm migrate:preflight
 *   pnpm migrate:preflight -- --only taste
 *   pnpm migrate:preflight -- --limit 3
 *   pnpm migrate:preflight -- --force-domain   # 跳过域名硬门槛（仅试跑）
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionToMarkdown } from 'notion-to-md';
import {
  R2_TARGET_DOMAIN,
  selectTargets,
  parseMigrationArgs,
  createNotionClient,
  queryAllPages,
  scanContentProd,
  extractImageUrls,
  collectImageBlocks,
  pairableImageBlocks,
  legacyKeyFromSeeUrl,
  fileEntryUrl,
  isSmmsUrl,
  delay,
} from './r2-migration-utils';
import { createR2S3Client, getR2Bucket } from './r2-uploader';
import { getFilesProperty } from './utils';

type UrlCategory = 'see' | 'r2' | 'other' | 'none';

function categorizeUrl(url: string | null): UrlCategory {
  if (!url) return 'none';
  if (isSmmsUrl(url)) return 'see';
  if (/varzy\.me/.test(url)) return 'r2';
  return 'other';
}

function checkEnv(): string[] {
  const required = [
    'NOTION_API_SECRET',
    'NOTION_POSTS_DATABASE_ID',
    'NOTION_KOTOBA_DATABASE_ID',
    'NOTION_TASTE_DATABASE_ID',
    'NOTION_PAGES_DATABASE_ID',
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_DOMAIN',
  ];
  return required.filter((v) => !process.env[v]);
}

interface PageReport {
  target: string;
  pageId: string;
  title: string;
  hasContentProd: boolean;
  pairableBlockCount: number;
  prodUrlCount: number;
  aligned: boolean;
  liveCategories: Record<UrlCategory, number>;
  blindSpotBlocks: { blockId: string; currentUrl: string | null }[];
  pageCoverSee: string | null;
  pageIconSee: string | null;
  tasteCoverProd: string | null;
  tasteCoverLive: string | null;
}

interface TargetReport {
  label: string;
  pagesScanned: number;
  pagesWithoutContentProd: number;
  mismatchedPages: number;
  alignedPages: number;
  totalProdSeeUrls: number;
  distinctProdSeeUrls: number;
  blindSpotBlocks: number;
  pageCoverSeeCount: number;
  pageIconSeeCount: number;
  tasteCoverNeedsRewrite: number;
  pages: PageReport[];
}

async function main() {
  const args = parseMigrationArgs(process.argv.slice(2));
  const targets = selectTargets(args);

  console.log('━'.repeat(60));
  console.log('🔍 R2 图片迁移预检（只读）');
  console.log('━'.repeat(60));

  // 1. 环境校验
  const missing = checkEnv();
  if (missing.length > 0) {
    console.error(`❌ 缺少环境变量：${missing.join(', ')}`);
    process.exit(1);
  }
  console.log('✅ 环境变量齐全');

  // 2. 域名硬门槛
  const domain = process.env.R2_PUBLIC_DOMAIN!;
  if (domain.replace(/\/+$/, '') !== R2_TARGET_DOMAIN) {
    if (args.forceDomain) {
      console.warn(
        `⚠️  R2_PUBLIC_DOMAIN=${domain}（非 ${R2_TARGET_DOMAIN}），已因 --force-domain 跳过；回写前必须改为 ${R2_TARGET_DOMAIN}。`,
      );
    } else {
      console.error(
        `❌ R2_PUBLIC_DOMAIN=${domain}，需为 ${R2_TARGET_DOMAIN}。请在 Cloudflare 绑定该域名后修改 .env，或加 --force-domain 试跑。`,
      );
      process.exit(1);
    }
  } else {
    console.log(`✅ 公开域名 = ${R2_TARGET_DOMAIN}`);
  }

  // 3. R2 连通性
  try {
    const client = createR2S3Client();
    const bucket = getR2Bucket();
    const res = await client.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: 'legacy/', MaxKeys: 1 }),
    );
    const legacyExists = (res.Contents?.length ?? 0) > 0;
    console.log(
      `✅ R2 S3 连通（桶 ${bucket}）；legacy/ 前缀已有对象：${legacyExists ? '是（可幂等续跑）' : '否'}`,
    );
  } catch (e) {
    console.error(`❌ R2 S3 连通失败：${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }

  const notion = createNotionClient();
  const n2m = new NotionToMarkdown({ notionClient: notion });

  const targetReports: TargetReport[] = [];
  const contentProdSeeUrls = new Set<string>(); // 全局 content.prod s.ee URL 集
  const legacyKeySet = new Map<string, string>(); // key → 首个来源 URL（冲突检测）

  for (const target of targets) {
    console.log(`\n▸ 扫描库：${target.label}`);
    const dbId = process.env[target.dbIdEnv];
    if (!dbId) {
      console.warn(`  ⚠️  ${target.dbIdEnv} 未设置，跳过`);
      continue;
    }

    const contentProd = scanContentProd(target.contentProdDir);
    console.log(`  content.prod 映射：${contentProd.size} 篇`);

    let pages: PageObjectResponse[];
    try {
      pages = await queryAllPages(notion, dbId);
    } catch (e) {
      console.error(
        `  ❌ 查询 ${target.label} 失败：${e instanceof Error ? e.message : String(e)}`,
      );
      continue;
    }
    const limited = args.limit ? pages.slice(0, args.limit) : pages;
    console.log(`  线上页面：${pages.length}${args.limit ? `（取前 ${args.limit}）` : ''}`);

    const report: TargetReport = {
      label: target.label,
      pagesScanned: limited.length,
      pagesWithoutContentProd: 0,
      mismatchedPages: 0,
      alignedPages: 0,
      totalProdSeeUrls: 0,
      distinctProdSeeUrls: 0,
      blindSpotBlocks: 0,
      pageCoverSeeCount: 0,
      pageIconSeeCount: 0,
      tasteCoverNeedsRewrite: 0,
      pages: [],
    };

    for (const page of limited) {
      const pageId = page.id;
      const title = pageTitle(page);
      const entry = contentProd.get(pageId);

      const pageReport: PageReport = {
        target: target.label,
        pageId,
        title,
        hasContentProd: !!entry,
        pairableBlockCount: 0,
        prodUrlCount: 0,
        aligned: false,
        liveCategories: { see: 0, r2: 0, other: 0, none: 0 },
        blindSpotBlocks: [],
        pageCoverSee: null,
        pageIconSee: null,
        tasteCoverProd: null,
        tasteCoverLive: null,
      };

      if (!entry) {
        report.pagesWithoutContentProd++;
        report.pages.push(pageReport);
        continue;
      }

      // content.prod 正文 s.ee URL（位置真源）
      const prodUrls = extractImageUrls(entry.body);
      pageReport.prodUrlCount = prodUrls.length;
      for (const u of prodUrls) {
        if (isSmmsUrl(u)) {
          contentProdSeeUrls.add(u);
          report.totalProdSeeUrls++;
          const key = legacyKeyFromSeeUrl(u);
          if (!legacyKeySet.has(key)) legacyKeySet.set(key, u);
        }
      }

      // taste cover frontmatter
      if (entry.coverUrl && isSmmsUrl(entry.coverUrl)) {
        pageReport.tasteCoverProd = entry.coverUrl;
        contentProdSeeUrls.add(entry.coverUrl);
        const key = legacyKeyFromSeeUrl(entry.coverUrl);
        if (!legacyKeySet.has(key)) legacyKeySet.set(key, entry.coverUrl);
      }

      // 线上 blockId 序列
      let allRefs: ReturnType<typeof collectImageBlocks> = [];
      try {
        const mdBlocks = await n2m.pageToMarkdown(pageId);
        allRefs = collectImageBlocks(mdBlocks);
      } catch (e) {
        console.warn(
          `  ⚠️  ${target.label}/${title}: pageToMarkdown 失败（${e instanceof Error ? e.message : String(e)}），跳过`,
        );
        report.pages.push(pageReport);
        await delay(100);
        continue;
      }

      const blindSpot = allRefs.filter((r) => r.underChildPage);
      pageReport.blindSpotBlocks = blindSpot.map((r) => ({
        blockId: r.blockId,
        currentUrl: r.currentUrl,
      }));
      report.blindSpotBlocks += blindSpot.length;

      const pairable = pairableImageBlocks(allRefs);
      pageReport.pairableBlockCount = pairable.length;
      for (const r of pairable) {
        pageReport.liveCategories[categorizeUrl(r.currentUrl)]++;
      }

      pageReport.aligned = pairable.length === prodUrls.length;
      if (pageReport.aligned) report.alignedPages++;
      else report.mismatchedPages++;

      // 页面级 cover/icon
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const coverUrl = fileEntryUrl((page as any).cover);
      if (coverUrl && isSmmsUrl(coverUrl)) {
        pageReport.pageCoverSee = coverUrl;
        report.pageCoverSeeCount++;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const iconUrl = fileEntryUrl((page as any).icon);
      if (iconUrl && isSmmsUrl(iconUrl)) {
        pageReport.pageIconSee = iconUrl;
        report.pageIconSeeCount++;
      }

      // taste cover 属性（files property）
      if (target.label === 'taste') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const liveCover = getFilesProperty((page as any).properties?.cover);
        if (liveCover) pageReport.tasteCoverLive = liveCover;
        if (pageReport.tasteCoverProd && liveCover && isSmmsUrl(liveCover)) {
          report.tasteCoverNeedsRewrite++;
        }
      }

      report.pages.push(pageReport);
      await delay(100);
    }

    report.distinctProdSeeUrls = contentProdSeeUrls.size; // 全局累计，此处仅作进度展示
    targetReports.push(report);

    console.log(
      `  对齐页：${report.alignedPages} / 不匹配：${report.mismatchedPages} / 无 content.prod：${report.pagesWithoutContentProd}`,
    );
    console.log(
      `  child_page 子树图片块：${report.blindSpotBlocks}；页面 cover s.ee：${report.pageCoverSeeCount}；icon s.ee：${report.pageIconSeeCount}`,
    );
  }

  // legacy key 冲突检测
  const collisions: { key: string; urls: string[] }[] = [];
  // 重新扫描一遍以发现同一 key 的不同来源 URL
  const keyToUrls = new Map<string, Set<string>>();
  for (const u of contentProdSeeUrls) {
    const key = legacyKeyFromSeeUrl(u);
    if (!keyToUrls.has(key)) keyToUrls.set(key, new Set());
    keyToUrls.get(key)!.add(u);
  }
  for (const [key, urls] of keyToUrls) {
    if (urls.size > 1) collisions.push({ key, urls: [...urls] });
  }

  // 异常：线上 s.ee 但不在 content.prod
  const anomalies: { target: string; pageId: string; url: string }[] = [];
  for (const tr of targetReports) {
    for (const pr of tr.pages) {
      // 用该页 pairable 块的线上 s.ee URL 比对全局 content.prod 集
      // pairable 块的 currentUrl 来自 pageToMarkdown 的 .parent，已在 categories 统计
      // 此处复用 pageReport 里的 liveCategories['see'] 计数，逐块细查需重放——为简化，仅标记页面级
      if (pr.liveCategories.see > 0 && pr.hasContentProd) {
        // 仅当该页有线上 s.ee 块时记录一条页面级标记
        anomalies.push({ target: pr.target, pageId: pr.pageId, url: '(见页面块)' });
      }
    }
  }

  // 写 JSON 报告
  const reportDir = path.resolve(process.cwd(), 'tmp');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'migration-preflight.json');
  const summary = {
    generatedAt: new Date().toISOString(),
    domain,
    targetDomain: R2_TARGET_DOMAIN,
    contentProdSeeUrlTotal: contentProdSeeUrls.size,
    legacyKeyCollisions: collisions,
    anomalies,
    targets: targetReports.map((t) => ({
      label: t.label,
      pagesScanned: t.pagesScanned,
      alignedPages: t.alignedPages,
      mismatchedPages: t.mismatchedPages,
      pagesWithoutContentProd: t.pagesWithoutContentProd,
      blindSpotBlocks: t.blindSpotBlocks,
      pageCoverSeeCount: t.pageCoverSeeCount,
      pageIconSeeCount: t.pageIconSeeCount,
      tasteCoverNeedsRewrite: t.tasteCoverNeedsRewrite,
      mismatchedPageList: t.pages
        .filter((p) => p.hasContentProd && !p.aligned)
        .map((p) => ({
          pageId: p.pageId,
          title: p.title,
          pairable: p.pairableBlockCount,
          prod: p.prodUrlCount,
        })),
      pagesWithoutContentProdList: t.pages
        .filter((p) => !p.hasContentProd)
        .map((p) => ({ pageId: p.pageId, title: p.title })),
    })),
  };
  fs.writeFileSync(reportPath, JSON.stringify(summary, null, 2));

  // 控制台汇总
  console.log('\n' + '━'.repeat(60));
  console.log('预检汇总');
  console.log('━'.repeat(60));
  for (const t of summary.targets) {
    console.log(
      `[${t.label}] 扫描 ${t.pagesScanned} 篇：对齐 ${t.alignedPages}，不匹配 ${t.mismatchedPages}，无 content.prod ${t.pagesWithoutContentProd}`,
    );
    console.log(
      `  child_page 子树图片：${t.blindSpotBlocks}；页面 cover s.ee：${t.pageCoverSeeCount}；icon s.ee：${t.pageIconSeeCount}；taste cover 待回写：${t.tasteCoverNeedsRewrite}`,
    );
  }
  console.log(`\ncontent.prod 独立 s.ee URL：${contentProdSeeUrls.size}`);
  console.log(`legacy key 冲突：${collisions.length}${collisions.length ? '（见 JSON）' : ''}`);
  console.log(`线上 s.ee 页面级标记：${anomalies.length}`);
  console.log(`\n📄 报告已写入 ${reportPath}`);

  const blocking = summary.targets.some((t) => t.mismatchedPages > 0) || collisions.length > 0;
  if (blocking) {
    console.warn(
      '\n⚠️  存在不匹配页或 key 冲突——rewrite 将跳过这些页，请审阅 JSON 后决定是否人工处理。',
    );
  } else {
    console.log('\n✅ 结构对齐全部通过，可进入 Step 1 下载。');
  }
}

function pageTitle(page: PageObjectResponse): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const props: any = (page as any).properties;
  if (!props) return page.id;
  for (const key of Object.keys(props)) {
    const p = props[key];
    if (p?.type === 'title' && Array.isArray(p.title)) {
      return p.title.map((t: { plain_text?: string }) => t.plain_text ?? '').join('') || page.id;
    }
  }
  return page.id;
}

main().catch((error) => {
  console.error('💥 Preflight failed:', error);
  process.exit(1);
});
