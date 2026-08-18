#!/usr/bin/env tsx
/**
 * Step 3 回写（核心）—— 断点续写版。
 *
 * 策略 D4：状态无关的 blockId 索引配对。对每个页面：
 *   - notion-to-md 的 pageToMarkdown 取「线上 blockId 图片序列」（前序 DFS，排除 child_page 子树）；
 *   - content.prod 正文取「迁移前 s.ee 位置真源」urls[]；
 *   - 断言 ids.length == urls.length，按索引 ids[i] ↔ urls[i] 一一配对，覆盖回写。
 *
 * 三项降本/容错：
 * 1. 进度文件 tmp/migration-rewrite-progress.json：逐页缓存计划(blockIds/urls/targets/已写标记) +
 *    queryAllPages 的页面列表。限流中断后下次从断点续跑——done 页零 Notion 调用、partial 页
 *    只补未写块且不重读、从未轮到的页才 pageToMarkdown。dry-run 即建好全部计划，--apply 只写不读。
 * 2. --scope uniform(默认)|see-only|hybrid 控制写哪些块：
 *    - uniform：无差别覆盖全部配对块到 legacy（修错位+统一命名，写量最大）。
 *    - see-only：只写 currentUrl 是 s.ee 的块（写量最小，但错位 R2-hash 不修、命名混合）。
 *    - hybrid：写 s.ee 块 + sha1 判为错位的 R2-hash 块，跳过正确 R2-hash 块。
 * 3. 产出迁移后引用集 tmp/post-migration-references.json（仅全量 --apply 完成后 allPagesCovered=true），
 *    供 cleanup:r2 跳过 Notion 读。
 *
 * 三重安全闸：页级数量断言、R2 存在性门、target 形状门。幂等 + sha1 诊断（非阻断）。
 *
 * 用法：
 *   pnpm migrate:rewrite                       # dry-run，建计划+打印 from→to
 *   pnpm migrate:rewrite -- --apply           # 回写（用 dry-run 缓存，只写不读）
 *   pnpm migrate:rewrite -- --scope see-only  # 仅 s.ee 块
 *   pnpm migrate:rewrite -- --only taste --limit 3
 *   pnpm migrate:rewrite -- --fresh           # 丢弃进度，从头读
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
  r2KeyFromUrl,
  fileEntryUrl,
  isSmmsUrl,
  getR2PublicDomain,
  delay,
  type ContentProdEntry,
} from './r2-migration-utils';
import { createR2S3Client, getR2Bucket, is404 } from './r2-uploader';
import { getFilesProperty } from './utils';

const UPDATE_DELAY_MS = 100;
const SAVE_EVERY_N_WRITES = 3;
const R2_HASH_RE = /_([0-9a-f]{16})\./i;
const PROGRESS_PATH = path.resolve(process.cwd(), 'tmp/migration-rewrite-progress.json');
const REFSET_PATH = path.resolve(process.cwd(), 'tmp/post-migration-references.json');

type Scope = 'uniform' | 'see-only' | 'hybrid';
type Action =
  | 'write'
  | 'skip_idempotent'
  | 'skip_r2_missing'
  | 'skip_not_see'
  | 'skip_bad_target'
  | 'skip_scope';

interface BlockPlan {
  blockId: string;
  seeUrl: string;
  target: string;
  currentUrl: string | null;
  r2Exists: boolean;
  action: Action;
  written: boolean;
  error?: string;
}

interface CoverPlan {
  surface: 'tasteCover' | 'pageCover' | 'pageIcon';
  pageId: string;
  seeUrl: string;
  target: string;
  currentUrl: string | null;
  r2Exists: boolean;
  action: Action;
  written: boolean;
  name?: string;
  error?: string;
}

interface PageProgress {
  pageId: string;
  target: string;
  title: string;
  hasContentProd: boolean;
  pairable: number;
  prod: number;
  blockMismatch: boolean;
  pageToMarkdownError?: string;
  blockOps: BlockPlan[];
  coverOps: CoverPlan[];
  status: 'partial' | 'done';
}

interface PageMeta {
  target: string;
  title: string;
  coverSee?: string;
  iconSee?: string;
  tasteCoverUrl?: string;
  tasteCoverName?: string;
}

interface ProgressFile {
  version: 1;
  scope: Scope;
  domain: string;
  queriedTargets: string[];
  pageIndex: Record<string, PageMeta>;
  pageOrder: string[];
  pages: Record<string, PageProgress>;
}

// ─── 小工具 ──────────────────────────────────────────────────────────────────

function sha1Hex16(s: string): string {
  return createHash('sha1').update(s).digest('hex').slice(0, 16);
}

function r2HashSegment(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(R2_HASH_RE);
  return m ? m[1] : null;
}

/** 当前 URL 是 R2-hash 且与 sha1(seeUrl)[:16] 不符 → 曾指向他图（folded 错位）。 */
function isMispointed(currentUrl: string | null, seeUrl: string): boolean {
  const seg = r2HashSegment(currentUrl);
  return seg !== null && seg !== sha1Hex16(seeUrl);
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

function extractPageMeta(page: PageObjectResponse, target: string): PageMeta {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coverUrl = fileEntryUrl((page as any).cover);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iconUrl = fileEntryUrl((page as any).icon);
  const tasteCoverUrl = getFilesProperty(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (page as any).properties?.cover,
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tasteCoverName: string | undefined =
    (page as any).properties?.cover?.files?.[0]?.name ?? undefined;
  return {
    target,
    title: pageTitle(page),
    coverSee: coverUrl && isSmmsUrl(coverUrl) ? coverUrl : undefined,
    iconSee: iconUrl && isSmmsUrl(iconUrl) ? iconUrl : undefined,
    tasteCoverUrl: tasteCoverUrl ?? undefined,
    tasteCoverName,
  };
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

function short(url: string | null, max = 48): string {
  if (!url) return '(none)';
  return url.length <= max ? url : '…' + url.slice(url.length - max + 1);
}

function parseScope(argv: string[]): Scope {
  const i = argv.indexOf('--scope');
  if (i >= 0 && argv[i + 1]) {
    const v = argv[i + 1];
    if (v === 'uniform' || v === 'see-only' || v === 'hybrid') return v;
    throw new Error(`Unknown --scope: ${v}. Valid: uniform, see-only, hybrid`);
  }
  return 'uniform';
}

// ─── 决策 ────────────────────────────────────────────────────────────────────

/**
 * 单个面的回写决策。顺序：非 s.ee 源 → skip_not_see；target 形状异常 → skip_bad_target；
 * 已是 target → skip_idempotent；R2 缺失 → skip_r2_missing；
 * 之后按 scope：uniform 全写；see-only 仅 currentUrl 是 s.ee 才写；
 * hybrid 额外写「错位 R2-hash」（sha1 不符），正确 R2-hash 跳过（skip_scope）。
 */
function decideAction(
  scope: Scope,
  seeUrl: string | null,
  currentUrl: string | null,
  target: string,
  r2Exists: boolean,
  domain: string,
): Action {
  if (!seeUrl || !isSmmsUrl(seeUrl)) return 'skip_not_see';
  if (!target.startsWith(`${domain}/legacy/`)) return 'skip_bad_target';
  if (currentUrl === target) return 'skip_idempotent';
  if (!r2Exists) return 'skip_r2_missing';
  if (scope === 'uniform') return 'write';
  const curIsSee = currentUrl !== null && isSmmsUrl(currentUrl);
  if (curIsSee) return 'write';
  if (scope === 'hybrid' && isMispointed(currentUrl, seeUrl)) return 'write';
  return 'skip_scope';
}

// ─── 计划构建 ─────────────────────────────────────────────────────────────────

/** 为一个页面构建全部 block/cover 计划（fresh，需 pageToMarkdown）。 */
async function buildPagePlan(
  pageId: string,
  meta: PageMeta,
  entry: ContentProdEntry | undefined,
  targetLabel: string,
  n2m: NotionToMarkdown,
  s3: S3Client,
  bucket: string,
  scope: Scope,
  domain: string,
): Promise<PageProgress> {
  const pp: PageProgress = {
    pageId,
    target: targetLabel,
    title: meta.title,
    hasContentProd: !!entry,
    pairable: 0,
    prod: 0,
    blockMismatch: false,
    blockOps: [],
    coverOps: [],
    status: 'partial',
  };

  let pairable: ReturnType<typeof pairableImageBlocks> = [];
  if (entry) {
    try {
      const mdBlocks = await n2m.pageToMarkdown(pageId);
      pairable = pairableImageBlocks(collectImageBlocks(mdBlocks));
      pp.pairable = pairable.length;
    } catch (e) {
      pp.pageToMarkdownError = e instanceof Error ? e.message : String(e);
    }
    const prodUrls = extractImageUrls(entry.body);
    pp.prod = prodUrls.length;
    if (!pp.pageToMarkdownError && pairable.length !== prodUrls.length) {
      pp.blockMismatch = true;
    }
    if (!pp.pageToMarkdownError && !pp.blockMismatch) {
      const heads = await Promise.all(
        prodUrls.map((u) =>
          isSmmsUrl(u) ? headR2Legacy(s3, bucket, legacyKeyFromSeeUrl(u)) : Promise.resolve(false),
        ),
      );
      for (let i = 0; i < prodUrls.length; i++) {
        const seeUrl = prodUrls[i];
        const cur = pairable[i].currentUrl;
        const target = legacyPublicUrl(seeUrl);
        pp.blockOps.push({
          blockId: pairable[i].blockId,
          seeUrl,
          target,
          currentUrl: cur,
          r2Exists: heads[i],
          action: decideAction(scope, seeUrl, cur, target, heads[i], domain),
          written: false,
        });
      }
    }
  }

  // taste cover 属性（content.prod frontmatter 真源）
  if (targetLabel === 'taste' && entry?.coverUrl) {
    const seeUrl = entry.coverUrl;
    const target = legacyPublicUrl(seeUrl);
    const r2Exists = await headR2Legacy(s3, bucket, legacyKeyFromSeeUrl(seeUrl));
    pp.coverOps.push({
      surface: 'tasteCover',
      pageId,
      seeUrl,
      target,
      currentUrl: meta.tasteCoverUrl ?? null,
      r2Exists,
      action: decideAction(scope, seeUrl, meta.tasteCoverUrl ?? null, target, r2Exists, domain),
      written: false,
      name: meta.tasteCoverName,
    });
  }

  // 页面级 cover/icon（线上 s.ee → host 替换）
  const pageCoverIcons: ['pageCover' | 'pageIcon', string | undefined][] = [
    ['pageCover', meta.coverSee],
    ['pageIcon', meta.iconSee],
  ];
  for (const [surface, see] of pageCoverIcons) {
    if (!see) continue;
    const target = legacyPublicUrl(see);
    const r2Exists = await headR2Legacy(s3, bucket, legacyKeyFromSeeUrl(see));
    pp.coverOps.push({
      surface,
      pageId,
      seeUrl: see,
      target,
      currentUrl: see,
      r2Exists,
      action: decideAction(scope, see, see, target, r2Exists, domain),
      written: false,
    });
  }

  return pp;
}

// ─── 执行 ────────────────────────────────────────────────────────────────────

async function applyBlock(notion: Client, op: BlockPlan): Promise<boolean> {
  try {
    await notion.blocks.update({
      block_id: op.blockId,
      image: { external: { url: op.target } },
    });
    return true;
  } catch (e) {
    op.error = e instanceof Error ? e.message : String(e);
    return false;
  }
}

async function applyCover(notion: Client, op: CoverPlan): Promise<boolean> {
  try {
    if (op.surface === 'tasteCover') {
      await notion.pages.update({
        page_id: op.pageId,
        properties: {
          cover: {
            files: [{ type: 'external', name: op.name || 'cover', external: { url: op.target } }],
          },
        },
      });
    } else if (op.surface === 'pageCover') {
      await notion.pages.update({
        page_id: op.pageId,
        cover: { type: 'external', external: { url: op.target } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    } else {
      await notion.pages.update({
        page_id: op.pageId,
        icon: { type: 'external', external: { url: op.target } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);
    }
    return true;
  } catch (e) {
    op.error = e instanceof Error ? e.message : String(e);
    return false;
  }
}

// ─── 进度文件 ─────────────────────────────────────────────────────────────────

function saveProgress(p: ProgressFile): void {
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify(p));
}

function loadProgress(): ProgressFile | null {
  if (!fs.existsSync(PROGRESS_PATH)) return null;
  try {
    const p = JSON.parse(fs.readFileSync(PROGRESS_PATH, 'utf-8')) as ProgressFile;
    if (p.version !== 1) return null;
    return p;
  } catch {
    return null;
  }
}

// ─── 引用集产出 ───────────────────────────────────────────────────────────────

function emitRefSet(progress: ProgressFile): void {
  // 遍历全部已查询页（pageOrder 只含 queriedTargets 的页）。
  // 不按本次 --only 过滤——否则「先全量、再 --only 重跑」会让被排除库的 key 缺失，
  // 而 allPagesCovered 仍可能为 true，cleanup 会误信残缺引用集误删对象。
  const keys = new Set<string>();
  const coveredPageIds: string[] = [];
  const uncoveredPageIds: string[] = [];
  for (const pid of progress.pageOrder) {
    const pp = progress.pages[pid];
    if (
      !pp ||
      pp.status !== 'done' ||
      pp.blockMismatch ||
      pp.pageToMarkdownError ||
      !pp.hasContentProd
    ) {
      uncoveredPageIds.push(pid);
      continue;
    }
    coveredPageIds.push(pid);
    for (const op of pp.blockOps) addRefKey(keys, op.written ? op.target : op.currentUrl);
    for (const op of pp.coverOps) addRefKey(keys, op.written ? op.target : op.currentUrl);
  }
  const allPagesCovered = uncoveredPageIds.length === 0 && coveredPageIds.length > 0;
  fs.writeFileSync(
    REFSET_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        allPagesCovered,
        queriedTargets: progress.queriedTargets,
        keys: [...keys],
        coveredPageIds,
        uncoveredPageIds,
      },
      null,
      2,
    ),
  );
}

function addRefKey(set: Set<string>, url: string | null): void {
  const key = r2KeyFromUrl(url);
  if (key) set.add(key);
}

// ─── 主流程 ───────────────────────────────────────────────────────────────────

async function main() {
  const argv = process.argv.slice(2);
  const args = parseMigrationArgs(argv);
  const scope = parseScope(argv);
  const fresh = argv.includes('--fresh');
  const targets = selectTargets(args);

  console.log('━'.repeat(60));
  console.log(
    args.apply
      ? `✏️  回写 Notion 图片 URL（APPLY / scope=${scope}）`
      : `👁️  回写 Notion 图片 URL（DRY-RUN / scope=${scope}）`,
  );
  console.log('━'.repeat(60));

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
    console.log('（dry-run：建计划并打印配对表，不回写。再加 --apply 回写。）');
  }

  const notion = createNotionClient();
  const n2m = new NotionToMarkdown({ notionClient: notion });
  const s3 = createR2S3Client();
  const bucket = getR2Bucket();

  const contentProds: Record<string, Map<string, ContentProdEntry>> = {};
  for (const t of targets) contentProds[t.label] = scanContentProd(t.contentProdDir);

  // 加载/初始化进度
  let progress: ProgressFile;
  const existing = fresh ? null : loadProgress();
  if (!existing) {
    progress = {
      version: 1,
      scope,
      domain,
      queriedTargets: [],
      pageIndex: {},
      pageOrder: [],
      pages: {},
    };
    console.log(fresh ? '进度：--fresh，从头开始。' : '进度：无历史，从头开始。');
  } else {
    progress = existing;
    if (progress.domain !== domain) {
      console.warn(`⚠️  域名变更（${progress.domain} → ${domain}），旧进度作废，从头开始。`);
      progress = {
        version: 1,
        scope,
        domain,
        queriedTargets: [],
        pageIndex: {},
        pageOrder: [],
        pages: {},
      };
    } else if (progress.scope !== scope) {
      console.warn(
        `⚠️  scope 变更（${progress.scope} → ${scope}）：保留已读缓存与已写标记，按新 scope 重算 action。`,
      );
      progress.scope = scope;
    } else {
      console.log(
        `进度：已缓存 ${progress.pageOrder.length} 页（queriedTargets: ${progress.queriedTargets.join(',') || '无'}）。`,
      );
    }
  }

  // 查询未缓存的库（补 pageIndex）
  for (const target of targets) {
    if (progress.queriedTargets.includes(target.label)) continue;
    const dbId = process.env[target.dbIdEnv];
    if (!dbId) {
      console.warn(`  ⚠️  ${target.dbIdEnv} 未设置，跳过该库`);
      continue;
    }
    console.log(`▸ 查询库 ${target.label} ...`);
    const pages = await queryAllPages(notion, dbId);
    for (const page of pages) {
      if (!progress.pageIndex[page.id]) {
        progress.pageIndex[page.id] = extractPageMeta(page, target.label);
        progress.pageOrder.push(page.id);
      }
    }
    progress.queriedTargets.push(target.label);
    saveProgress(progress);
    console.log(`  ${pages.length} 页入索引`);
    await delay(100);
  }

  // 本轮处理的页面集（按 --only / --limit 过滤）
  const targetLabels = new Set(targets.map((t) => t.label));
  let pageSet = progress.pageOrder.filter((pid) =>
    targetLabels.has(progress.pageIndex[pid].target),
  );
  if (args.limit) pageSet = pageSet.slice(0, args.limit);
  console.log(`本轮处理：${pageSet.length} 页`);

  let writeCount = 0;
  let applyErrors = 0;

  for (const pageId of pageSet) {
    const meta = progress.pageIndex[pageId];
    const entry = contentProds[meta.target]?.get(pageId);

    let pp = progress.pages[pageId];
    if (!pp) {
      // fresh：pageToMarkdown + 建计划
      console.log(`  · ${meta.title} [${pageId}]（读取中...）`);
      try {
        pp = await buildPagePlan(pageId, meta, entry, meta.target, n2m, s3, bucket, scope, domain);
      } catch (e) {
        console.error(
          `  ❌ 建计划失败 ${meta.title}: ${e instanceof Error ? e.message : String(e)}`,
        );
        pp = {
          pageId,
          target: meta.target,
          title: meta.title,
          hasContentProd: !!entry,
          pairable: 0,
          prod: 0,
          blockMismatch: false,
          pageToMarkdownError: e instanceof Error ? e.message : String(e),
          blockOps: [],
          coverOps: [],
          status: 'done', // 出错的页无可写项，标 done 跳过
        };
      }
      progress.pages[pageId] = pp;
      saveProgress(progress);
      printPagePlan(pp);
      if (pp.pageToMarkdownError || pp.blockMismatch) {
        await delay(50);
        continue;
      }
    } else {
      // resume：用缓存计划，重算 action（保留 written）
      for (const op of pp.blockOps) {
        op.action = decideAction(scope, op.seeUrl, op.currentUrl, op.target, op.r2Exists, domain);
      }
      for (const op of pp.coverOps) {
        op.action = decideAction(scope, op.seeUrl, op.currentUrl, op.target, op.r2Exists, domain);
      }
    }

    // 执行回写
    if (args.apply) {
      for (const op of pp.blockOps) {
        if (op.action === 'write' && !op.written) {
          if (await applyBlock(notion, op)) {
            op.written = true;
            writeCount++;
          } else {
            applyErrors++;
            console.error(`  ❌ block ${op.blockId.slice(0, 8)}: ${op.error}`);
          }
          if (writeCount % SAVE_EVERY_N_WRITES === 0) saveProgress(progress);
          await delay(UPDATE_DELAY_MS);
        }
      }
      for (const op of pp.coverOps) {
        if (op.action === 'write' && !op.written) {
          if (await applyCover(notion, op)) {
            op.written = true;
            writeCount++;
          } else {
            applyErrors++;
            console.error(`  ❌ ${op.surface}: ${op.error}`);
          }
          if (writeCount % SAVE_EVERY_N_WRITES === 0) saveProgress(progress);
          await delay(UPDATE_DELAY_MS);
        }
      }
    }

    // 更新页状态
    const hasUnwritten = [...pp.blockOps, ...pp.coverOps].some(
      (o) => o.action === 'write' && !o.written,
    );
    pp.status = hasUnwritten ? 'partial' : 'done';
    saveProgress(progress);
    await delay(50);
  }

  // 产出引用集
  emitRefSet(progress);

  // ┇总
  const allOps = Object.values(progress.pages).flatMap((pp) => [...pp.blockOps, ...pp.coverOps]);
  const stats = {
    pagesInIndex: progress.pageOrder.length,
    pagesPlanned: Object.keys(progress.pages).length,
    pagesDone: Object.values(progress.pages).filter((p) => p.status === 'done').length,
    pagesPartial: Object.values(progress.pages).filter((p) => p.status === 'partial').length,
    pagesBlockMismatch: Object.values(progress.pages).filter((p) => p.blockMismatch).length,
    pagesPageToMdError: Object.values(progress.pages).filter((p) => p.pageToMarkdownError).length,
    opsWrite: allOps.filter((o) => o.action === 'write').length,
    opsIdempotent: allOps.filter((o) => o.action === 'skip_idempotent').length,
    opsR2Missing: allOps.filter((o) => o.action === 'skip_r2_missing').length,
    opsNotSee: allOps.filter((o) => o.action === 'skip_not_see').length,
    opsBadTarget: allOps.filter((o) => o.action === 'skip_bad_target').length,
    opsScopeSkipped: allOps.filter((o) => o.action === 'skip_scope').length,
    opsWritten: allOps.filter((o) => o.written).length,
    applyErrors,
    sha1Mispointed: allOps.filter((o) => 'blockId' in o && isMispointed(o.currentUrl, o.seeUrl))
      .length,
  };

  console.log('\n' + '━'.repeat(60));
  console.log('汇总');
  console.log('━'.repeat(60));
  console.log(
    `页面：索引 ${stats.pagesInIndex}，已建计划 ${stats.pagesPlanned}（done ${stats.pagesDone} / partial ${stats.pagesPartial} / 块数不匹配 ${stats.pagesBlockMismatch} / pageToMd 错误 ${stats.pagesPageToMdError}）`,
  );
  console.log(
    `操作：待写 ${stats.opsWrite}，幂等跳过 ${stats.opsIdempotent}，R2 缺失跳过 ${stats.opsR2Missing}，非 s.ee 跳过 ${stats.opsNotSee}，target 异常 ${stats.opsBadTarget}，scope 跳过 ${stats.opsScopeSkipped}`,
  );
  if (args.apply) {
    console.log(`本轮回写 ${writeCount}，累计已写 ${stats.opsWritten}，回写错误 ${applyErrors}`);
    if (stats.opsWrite > stats.opsWritten) {
      console.log(
        `仍有 ${stats.opsWrite - stats.opsWritten} 项待写——重跑 pnpm migrate:rewrite -- --apply 续写。`,
      );
    }
  } else {
    console.log(
      `（dry-run 未回写；待写 ${stats.opsWrite} 项。加 --apply 回写，计划已缓存，--apply 只写不读。）`,
    );
  }
  console.log(`sha1 错位诊断：${stats.sha1Mispointed}`);
  if (stats.opsR2Missing > 0) {
    console.warn(
      '⚠️  有 R2 缺失对象——先 pnpm migrate:download && pnpm migrate:upload 补齐后重试。',
    );
  }
  console.log(`\n📄 进度：${PROGRESS_PATH}`);
  console.log(`📄 引用集：${REFSET_PATH}`);

  if (args.apply && applyErrors > 0) process.exitCode = 1;
}

function printPagePlan(pp: PageProgress): void {
  if (pp.blockOps.length === 0 && pp.coverOps.length === 0) return;
  console.log(
    `  · ${pp.title} [${pp.pageId}]  pairable=${pp.pairable} prod=${pp.prod}${pp.blockMismatch ? ' ⚠块数不匹配' : ''}${pp.pageToMarkdownError ? ' ⚠pageToMd失败' : ''}`,
  );
  for (const op of pp.blockOps) {
    console.log(
      `      [block ${op.blockId.slice(0, 8)}] ${short(op.currentUrl)} → ${short(op.target)}  r2:${op.r2Exists ? '✓' : '✗'}  ${op.action}`,
    );
  }
  for (const op of pp.coverOps) {
    console.log(
      `      [${op.surface}] ${short(op.currentUrl)} → ${short(op.target)}  r2:${op.r2Exists ? '✓' : '✗'}  ${op.action}`,
    );
  }
}

main().catch((error) => {
  console.error('💥 Rewrite failed:', error);
  process.exit(1);
});
