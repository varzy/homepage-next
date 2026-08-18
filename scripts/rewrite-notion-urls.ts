#!/usr/bin/env tsx
/**
 * Step 3 回写（核心）：把 Notion 图片块/属性改写到 R2 `cdn.varzy.me/legacy/<原 s.ee 路径>`。
 *
 * 策略 D4：状态无关的 blockId 索引配对。对每个页面：
 *   - 用 notion-to-md 的 pageToMarkdown 取「线上 blockId 图片序列」ids[]（前序 DFS，排除 child_page 子树）；
 *   - 用 content.prod 正文取「迁移前 s.ee 位置真源」urls[]；
 *   - 断言 ids.length == urls.length，按索引 ids[i] ↔ urls[i] 一一配对，覆盖回写。
 *
 * 三重安全闸：
 *   1. 页级数量断言——不等则跳过该页全部块回写（记人工复核）。
 *   2. R2 存在性门——HeadObject(legacyKey(urls[i])) 必须存在，否则该块跳过+标记。
 *   3. target 形状门——target 必须形如 `<R2_PUBLIC_DOMAIN>/legacy/...` 才写。
 * 幂等：当前块 URL == target 则跳过。sha1 诊断（非阻断）：线上 R2-hash 与 sha1(seeUrl)[:16] 不符则提示曾指向他图。
 *
 * 三个回写面（各自独立配 R2 门）：
 *   - 图片块（blocks.update，image.external.url）
 *   - taste cover 属性（pages.update，properties.cover.files[external]）
 *   - 页面级 cover/icon（pages.update，cover/icon external）——host 字符串替换，fetcher 不写 .md 故走线上
 *
 * dry-run 默认（仅打印 from→to + 配对表 + R2 门结果）；--apply 才回写。输出 tmp/migration-rewrite.json 审计。
 *
 * 用法：
 *   pnpm migrate:rewrite                    # dry-run，审阅配对表
 *   pnpm migrate:rewrite -- --apply         # 真正回写
 *   pnpm migrate:rewrite -- --only taste
 *   pnpm migrate:rewrite -- --limit 3 --apply
 */

import 'dotenv/config';
import fs from 'fs';
import { createHash } from 'node:crypto';
import path from 'path';
import { HeadObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Client } from '@notionhq/client';
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
  legacyPublicUrl,
  fileEntryUrl,
  isSmmsUrl,
  getR2PublicDomain,
  delay,
} from './r2-migration-utils';
import { createR2S3Client, getR2Bucket, is404 } from './r2-uploader';
import { getFilesProperty } from './utils';

const UPDATE_DELAY_MS = 100;
/** 旧 R2-hash 文件名形如 `<prefix>_<pageId>_<sha1[:16]>.<ext>`，取其中 16-hex 段做诊断比对。 */
const R2_HASH_RE = /_([0-9a-f]{16})\./i;

function sha1Hex16(s: string): string {
  return createHash('sha1').update(s).digest('hex').slice(0, 16);
}

function r2HashSegment(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(R2_HASH_RE);
  return m ? m[1] : null;
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

type Surface = 'block' | 'tasteCover' | 'pageCover' | 'pageIcon';

interface RewriteOp {
  surface: Surface;
  target: string;
  pageId: string;
  title: string;
  /** 图片块 id（surface=block 时必填） */
  blockId?: string;
  /** 该面在线上的当前 URL（dry-run 展示用；可能为 null） */
  from: string | null;
  /** taste cover 回写时沿用的线上 file.name */
  name?: string;
  r2Exists: boolean;
  action: 'write' | 'skip_idempotent' | 'skip_r2_missing' | 'skip_not_see' | 'skip_bad_target';
  applied?: boolean;
  error?: string;
}

interface Sha1Diagnostic {
  pageId: string;
  blockId: string;
  currentUrl: string;
  expected: string;
  got: string;
  seeUrl: string;
}

interface PageSummary {
  target: string;
  pageId: string;
  title: string;
  hasContentProd: boolean;
  pairable: number;
  prod: number;
  blockMismatch: boolean;
  pageToMarkdownError?: string;
  ops: RewriteOp[];
}

/** HEAD 探测 R2 legacy 对象是否存在；404 返回 false，其余错误向上抛。 */
async function headR2Legacy(client: S3Client, bucket: string, key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (e) {
    if (is404(e)) return false;
    throw e;
  }
}

/** 截断 URL 便于控制台展示。 */
function short(url: string | null, max = 48): string {
  if (!url) return '(none)';
  return url.length <= max ? url : '…' + url.slice(url.length - max + 1);
}

/**
 * 为单个面构造 op（不含执行）。统一处理：非 s.ee 跳过、R2 门、幂等、target 形状门。
 */
function planSurface(
  surface: Surface,
  pageId: string,
  title: string,
  seeUrl: string | null,
  currentUrl: string | null,
  blockId: string | undefined,
  name: string | undefined,
  domain: string,
  r2Exists: boolean,
): RewriteOp {
  const base: RewriteOp = {
    surface,
    target: '',
    pageId,
    title,
    blockId,
    from: currentUrl,
    name,
    r2Exists,
    action: 'skip_not_see',
  };
  if (!seeUrl || !isSmmsUrl(seeUrl)) {
    return base;
  }
  const target = legacyPublicUrl(seeUrl);
  if (!target.startsWith(`${domain}/legacy/`)) {
    return { ...base, target, action: 'skip_bad_target' };
  }
  if (currentUrl === target) {
    return { ...base, target, action: 'skip_idempotent' };
  }
  if (!r2Exists) {
    return { ...base, target, action: 'skip_r2_missing' };
  }
  return { ...base, target, action: 'write' };
}

/** 执行单个 write op（调用对应 Notion API）。成功 true。 */
async function applyOp(notion: Client, op: RewriteOp): Promise<boolean> {
  try {
    switch (op.surface) {
      case 'block':
        await notion.blocks.update({
          block_id: op.blockId!,
          image: { external: { url: op.target } },
        });
        break;
      case 'tasteCover':
        await notion.pages.update({
          page_id: op.pageId,
          properties: {
            cover: {
              files: [{ type: 'external', name: op.name || 'cover', external: { url: op.target } }],
            },
          },
        });
        break;
      case 'pageCover':
        await notion.pages.update({
          page_id: op.pageId,
          cover: { type: 'external', external: { url: op.target } },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        break;
      case 'pageIcon':
        await notion.pages.update({
          page_id: op.pageId,
          icon: { type: 'external', external: { url: op.target } },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
        break;
    }
    op.applied = true;
    return true;
  } catch (e) {
    op.applied = false;
    op.error = e instanceof Error ? e.message : String(e);
    return false;
  }
}

async function main() {
  const args = parseMigrationArgs(process.argv.slice(2));
  const targets = selectTargets(args);

  console.log('━'.repeat(60));
  console.log(
    args.apply ? '✏️  回写 Notion 图片 URL（APPLY）' : '👁️  回写 Notion 图片 URL（DRY-RUN）',
  );
  console.log('━'.repeat(60));

  // 域名硬门槛（回写面一律以此为准）
  const domain = getR2PublicDomain();
  if (domain !== R2_TARGET_DOMAIN) {
    if (args.forceDomain) {
      console.warn(
        `⚠️  R2_PUBLIC_DOMAIN=${domain}（非 ${R2_TARGET_DOMAIN}），因 --force-domain 继续。回写到生产前必须改为 ${R2_TARGET_DOMAIN}。`,
      );
    } else {
      console.error(
        `❌ R2_PUBLIC_DOMAIN=${domain}，需为 ${R2_TARGET_DOMAIN}。加 --force-domain 可试跑。`,
      );
      process.exit(1);
    }
  } else {
    console.log(`✅ 公开域名 = ${R2_TARGET_DOMAIN}`);
  }
  if (!args.apply) {
    console.log('（dry-run：仅打印配对表与计划，不回写。加 --apply 回写。）');
  }

  const notion = createNotionClient();
  const n2m = new NotionToMarkdown({ notionClient: notion });
  const s3 = createR2S3Client();
  const bucket = getR2Bucket();

  const allOps: RewriteOp[] = [];
  const diagnostics: Sha1Diagnostic[] = [];
  const pageSummaries: PageSummary[] = [];
  let pagesNoContentProd = 0;
  let pageToMdErrors = 0;

  for (const target of targets) {
    console.log(`\n▸ ${target.label}`);
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

    for (const page of limited) {
      const pageId = page.id;
      const title = pageTitle(page);
      const entry = contentProd.get(pageId);

      const summary: PageSummary = {
        target: target.label,
        pageId,
        title,
        hasContentProd: !!entry,
        pairable: 0,
        prod: 0,
        blockMismatch: false,
        ops: [],
      };

      if (!entry) {
        pagesNoContentProd++;
        // 仍尝试页面级 cover/icon（不依赖 content.prod）
        const coverOps = await planPageCoverIcon(s3, bucket, page, domain, title);
        summary.ops.push(...coverOps);
        allOps.push(...coverOps);
        pageSummaries.push(summary);
        await delay(50);
        continue;
      }

      // 线上 blockId 序列
      let pairable: ReturnType<typeof pairableImageBlocks> = [];
      let mdError: string | undefined;
      try {
        const mdBlocks = await n2m.pageToMarkdown(pageId);
        pairable = pairableImageBlocks(collectImageBlocks(mdBlocks));
      } catch (e) {
        mdError = e instanceof Error ? e.message : String(e);
        pageToMdErrors++;
        summary.pageToMarkdownError = mdError;
        console.warn(
          `  ⚠️  ${target.label}/${title}: pageToMarkdown 失败（${mdError}），跳过块回写`,
        );
      }

      const prodUrls = extractImageUrls(entry.body);
      summary.pairable = pairable.length;
      summary.prod = prodUrls.length;

      const blockOps: RewriteOp[] = [];
      if (mdError) {
        // 块回写跳过；cover 仍尝试
      } else if (pairable.length !== prodUrls.length) {
        summary.blockMismatch = true;
        console.warn(
          `  ⚠️  ${target.label}/${title}: 块数 ${pairable.length} ≠ content.prod URL 数 ${prodUrls.length}，跳过该页块回写（人工复核）`,
        );
      } else {
        // 并行 HEAD 检查该页全部 legacy 对象
        const headResults = await Promise.all(
          prodUrls.map((u) => {
            if (!isSmmsUrl(u)) return Promise.resolve(false);
            return headR2Legacy(s3, bucket, legacyKeyFromSeeUrl(u));
          }),
        );
        for (let i = 0; i < prodUrls.length; i++) {
          const seeUrl = prodUrls[i];
          const cur = pairable[i].currentUrl;
          const op = planSurface(
            'block',
            pageId,
            title,
            seeUrl,
            cur,
            pairable[i].blockId,
            undefined,
            domain,
            headResults[i],
          );
          blockOps.push(op);
          // sha1 诊断：线上 R2-hash 与 sha1(seeUrl)[:16] 不符 → 曾指向他图
          const seg = r2HashSegment(cur);
          if (seg) {
            const expected = sha1Hex16(seeUrl);
            if (seg !== expected) {
              diagnostics.push({
                pageId,
                blockId: pairable[i].blockId,
                currentUrl: cur ?? '',
                expected,
                got: seg,
                seeUrl,
              });
            }
          }
        }
      }

      // taste cover 属性（content.prod frontmatter 真源，独立于块配对）
      const coverOps: RewriteOp[] = [];
      if (target.label === 'taste' && entry.coverUrl) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const liveCover = getFilesProperty((page as any).properties?.cover);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const liveName: string = (page as any).properties?.cover?.files?.[0]?.name ?? 'cover';
        const r2Exists = isSmmsUrl(entry.coverUrl)
          ? await headR2Legacy(s3, bucket, legacyKeyFromSeeUrl(entry.coverUrl))
          : false;
        coverOps.push(
          planSurface(
            'tasteCover',
            pageId,
            title,
            entry.coverUrl,
            liveCover,
            undefined,
            liveName,
            domain,
            r2Exists,
          ),
        );
      }

      // 页面级 cover/icon（线上 host 替换，独立于块配对）
      const pageCoverIconOps = await planPageCoverIcon(s3, bucket, page, domain, title);

      summary.ops.push(...blockOps, ...coverOps, ...pageCoverIconOps);
      allOps.push(...blockOps, ...coverOps, ...pageCoverIconOps);

      // dry-run 打印该页配对表
      if (summary.ops.length > 0) {
        console.log(`  · ${title}  [${pageId}]`);
        for (const op of summary.ops) {
          const tag =
            op.surface === 'block'
              ? `block ${op.blockId?.slice(0, 8)}`
              : op.surface === 'tasteCover'
                ? 'taste.cover'
                : op.surface === 'pageCover'
                  ? 'page.cover'
                  : 'page.icon';
          const gate = op.r2Exists ? '✓' : '✗';
          const decision =
            op.action === 'write' ? (args.apply ? 'WRITE' : 'will-write') : op.action;
          console.log(
            `      [${tag}] ${short(op.from)} → ${short(op.target)}  r2:${gate}  ${decision}`,
          );
        }
      }

      pageSummaries.push(summary);
      await delay(50);
    }
  }

  // 执行回写
  let written = 0;
  let applyErrors = 0;
  if (args.apply) {
    console.log('\n━'.repeat(60));
    console.log('回写中（顺序执行，每项间隔 100ms）...');
    for (const op of allOps) {
      if (op.action !== 'write') continue;
      const ok = await applyOp(notion, op);
      if (ok) written++;
      else {
        applyErrors++;
        console.error(`  ❌ ${op.surface} ${op.blockId ?? op.pageId}: ${op.error}`);
      }
      await delay(UPDATE_DELAY_MS);
    }
  }

  // 汇总
  const stats = {
    pagesScanned: pageSummaries.length,
    pagesNoContentProd,
    pageToMdErrors,
    pagesBlockMismatch: pageSummaries.filter((s) => s.blockMismatch).length,
    opsTotal: allOps.length,
    opsWrite: allOps.filter((o) => o.action === 'write').length,
    opsIdempotent: allOps.filter((o) => o.action === 'skip_idempotent').length,
    opsR2Missing: allOps.filter((o) => o.action === 'skip_r2_missing').length,
    opsNotSee: allOps.filter((o) => o.action === 'skip_not_see').length,
    opsBadTarget: allOps.filter((o) => o.action === 'skip_bad_target').length,
    applied: args.apply ? written : 0,
    applyErrors,
    sha1Diagnostics: diagnostics.length,
  };

  // 审计 JSON
  const reportDir = path.resolve(process.cwd(), 'tmp');
  if (!fs.existsSync(reportDir)) fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'migration-rewrite.json');
  const report = {
    generatedAt: new Date().toISOString(),
    mode: args.apply ? 'apply' : 'dry-run',
    domain,
    stats,
    sha1Diagnostics: diagnostics,
    mismatchedPages: pageSummaries
      .filter((s) => s.blockMismatch)
      .map((s) => ({
        target: s.target,
        pageId: s.pageId,
        title: s.title,
        pairable: s.pairable,
        prod: s.prod,
      })),
    pagesWithoutContentProd: pageSummaries
      .filter((s) => !s.hasContentProd)
      .map((s) => ({ target: s.target, pageId: s.pageId, title: s.title })),
    r2MissingOps: allOps
      .filter((o) => o.action === 'skip_r2_missing')
      .map((o) => ({
        surface: o.surface,
        pageId: o.pageId,
        blockId: o.blockId,
        from: o.from,
        target: o.target,
      })),
    applyErrors: allOps
      .filter((o) => o.error)
      .map((o) => ({
        surface: o.surface,
        pageId: o.pageId,
        blockId: o.blockId,
        target: o.target,
        error: o.error,
      })),
    ops: allOps.map((o) => ({
      surface: o.surface,
      pageId: o.pageId,
      blockId: o.blockId,
      from: o.from,
      target: o.target,
      action: o.action,
      r2Exists: o.r2Exists,
      applied: o.applied,
      error: o.error,
    })),
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('\n━'.repeat(60));
  console.log('汇总');
  console.log('━'.repeat(60));
  console.log(
    `页面：${stats.pagesScanned}（无 content.prod ${stats.pagesNoContentProd}，pageToMd 错误 ${stats.pageToMdErrors}，块数不匹配 ${stats.pagesBlockMismatch}）`,
  );
  console.log(
    `操作：待写 ${stats.opsWrite}，幂等跳过 ${stats.opsIdempotent}，R2 缺失跳过 ${stats.opsR2Missing}，非 s.ee 跳过 ${stats.opsNotSee}，target 形状异常 ${stats.opsBadTarget}`,
  );
  if (args.apply) {
    console.log(`已回写 ${stats.applied}，回写错误 ${stats.applyErrors}`);
  } else {
    console.log('（dry-run 未回写；加 --apply 执行上述「待写」项）');
  }
  console.log(`sha1 诊断（曾指向他图）：${stats.sha1Diagnostics}`);
  if (stats.sha1Diagnostics > 0) {
    for (const d of diagnostics.slice(0, 10)) {
      console.warn(
        `  · ${d.blockId.slice(0, 8)} got=${d.got} expected=${d.expected}  ← ${short(d.seeUrl)}`,
      );
    }
    if (diagnostics.length > 10) console.warn(`  ... 还有 ${diagnostics.length - 10} 条`);
  }
  console.log(`\n📄 审计报告：${reportPath}`);

  if (stats.opsR2Missing > 0) {
    console.warn(
      '⚠️  有 R2 缺失对象——请先跑 pnpm migrate:download && pnpm migrate:upload 补齐后重试。',
    );
  }
  if (args.apply && applyErrors > 0) {
    process.exitCode = 1;
  }
}

/**
 * 规划页面级 cover/icon 回写（host 字符串替换）。
 * fetcher 不把 page.cover/page.icon 写入 .md，故直接读线上；若为 s.ee 则替换为 legacy URL。
 * 不依赖 content.prod（页面级 cover 不在快照里），R2 对象由 download 的线上扫描补齐。
 */
async function planPageCoverIcon(
  s3: S3Client,
  bucket: string,
  page: PageObjectResponse,
  domain: string,
  title: string,
): Promise<RewriteOp[]> {
  const ops: RewriteOp[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const liveCover = fileEntryUrl((page as any).cover);
  if (liveCover && isSmmsUrl(liveCover)) {
    const r2Exists = await headR2Legacy(s3, bucket, legacyKeyFromSeeUrl(liveCover));
    ops.push(
      planSurface(
        'pageCover',
        page.id,
        title,
        liveCover,
        liveCover,
        undefined,
        undefined,
        domain,
        r2Exists,
      ),
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const liveIcon = fileEntryUrl((page as any).icon);
  if (liveIcon && isSmmsUrl(liveIcon)) {
    const r2Exists = await headR2Legacy(s3, bucket, legacyKeyFromSeeUrl(liveIcon));
    ops.push(
      planSurface(
        'pageIcon',
        page.id,
        title,
        liveIcon,
        liveIcon,
        undefined,
        undefined,
        domain,
        r2Exists,
      ),
    );
  }
  return ops;
}

main().catch((error) => {
  console.error('💥 Rewrite failed:', error);
  process.exit(1);
});
