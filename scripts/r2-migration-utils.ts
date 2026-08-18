/**
 * s.ee → R2 迁移共享工具（阶段一）。
 *
 * 设计要点见 docs/migrate-image-to-r2-implementation.md 的 D4：
 * 用 blockId 索引配对（状态无关）回写 Notion，content.prod 作为迁移前 s.ee 位置真源。
 * 本模块供 preflight-check / rewrite-notion-urls 共用，download / upload 脚本按需引用少量 helper。
 *
 * 关键不变量：collectImageBlocks 的遍历顺序 == notion-to-md 的 toMarkdownString 向 .parent 的展开顺序，
 * 而 content.prod 的 .md 正文 = 该 .parent，故 ids[i] ↔ urls[i] 按索引一一对应。
 */

import fs from 'fs';
import path from 'path';
import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import matter from 'gray-matter';
import { NotionToMarkdown } from 'notion-to-md';
import { isSmmsUrl } from './smms-uploader';

// notion-to-md 未从包根再导出 MdBlock，这里从 pageToMarkdown 的返回类型派生，避免深路径导入。
type MdBlock = Awaited<ReturnType<NotionToMarkdown['pageToMarkdown']>>[number];

// ─── 目标库 ──────────────────────────────────────────────────────────────────

export interface MigrationTarget {
  /** 用于 --only 过滤的库标识 */
  label: string;
  /** 存放该库 database id 的环境变量名 */
  dbIdEnv: string;
  /** content.prod 下该库的目录（相对 cwd） */
  contentProdDir: string;
}

export const MIGRATION_TARGETS: readonly MigrationTarget[] = [
  { label: 'posts', dbIdEnv: 'NOTION_POSTS_DATABASE_ID', contentProdDir: 'content.prod/posts' },
  { label: 'kotoba', dbIdEnv: 'NOTION_KOTOBA_DATABASE_ID', contentProdDir: 'content.prod/kotoba' },
  { label: 'taste', dbIdEnv: 'NOTION_TASTE_DATABASE_ID', contentProdDir: 'content.prod/taste' },
  { label: 'pages', dbIdEnv: 'NOTION_PAGES_DATABASE_ID', contentProdDir: 'content.prod/pages' },
];

/** 迁移目标公开域名（PRD 指定）。preflight 以此为硬门槛。 */
export const R2_TARGET_DOMAIN = 'https://cdn.varzy.me';

// ─── URL / key 映射 ──────────────────────────────────────────────────────────

const SEE_IMAGE_RE = /!\[[^\]]*\]\(([^)]+)\)/g;
const IMAGE_PARENT_RE = /^!\[/;

/**
 * 按文本顺序提取 markdown 正文中的所有图片 URL。
 * 复用 restore-notion-from-md.ts 的正则（content.prod 正文 = notion-to-md 的 .parent）。
 */
export function extractImageUrls(body: string): string[] {
  const urls: string[] = [];
  SEE_IMAGE_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = SEE_IMAGE_RE.exec(body)) !== null) {
    urls.push(m[1]);
  }
  return urls;
}

/**
 * 由 s.ee 源 URL 推导 R2 legacy 对象 key：剥 host，前缀 legacy/，其余路径原样保留。
 * 例：https://i.see.you/2026/05/21/jZf0/foo.webp → legacy/2026/05/21/jZf0/foo.webp
 */
export function legacyKeyFromSeeUrl(url: string): string {
  const u = new URL(url);
  const p = u.pathname.replace(/^\/+/, '');
  return `legacy/${p}`;
}

/**
 * 读取并校验 R2_PUBLIC_DOMAIN（去尾部斜杠）。缺失抛错。
 */
export function getR2PublicDomain(): string {
  const raw = process.env.R2_PUBLIC_DOMAIN;
  if (!raw) {
    throw new Error('Missing required environment variable: R2_PUBLIC_DOMAIN');
  }
  return raw.replace(/\/+$/, '');
}

/**
 * 由 s.ee 源 URL 推导迁移后的公开访问 URL：${R2_PUBLIC_DOMAIN}/${legacyKey}。
 */
export function legacyPublicUrl(seeUrl: string): string {
  return `${getR2PublicDomain()}/${legacyKeyFromSeeUrl(seeUrl)}`;
}

/**
 * 从 Notion file/external 条目（page.cover / page.icon / files 属性条目）取 URL。
 * 复用 cleanup-r2-orphans.ts 的 fileEntryUrl 范式。
 */
type FileEntry = { type: string; file?: { url: string }; external?: { url: string } };
export function fileEntryUrl(entry: FileEntry | null | undefined): string | null {
  if (!entry) return null;
  if (entry.type === 'file' && entry.file) return entry.file.url;
  if (entry.type === 'external' && entry.external) return entry.external.url;
  return null;
}

// ─── blockId 树遍历（D4 核心）──────────────────────────────────────────────

export interface ImageBlockRef {
  blockId: string;
  /** 该块当前的图片 URL（从 .parent 解析）；解析失败为 null。 */
  currentUrl: string | null;
  /** 是否位于 child_page 子树内。此类块在 content.prod 的 .parent 中无对应项，无法位置配对。 */
  underChildPage: boolean;
}

/**
 * 前序 DFS 遍历 notion-to-md 的 MdBlock 树，收集全部图片块引用（含 child_page 子树内的）。
 *
 * 顺序镜像 toMarkdownString 向 .parent 的展开。child_page 的子块在 toMarkdownString 中被输出到
 * 独立 key（不在本页 .parent，content.prod 也不含），故配对时必须排除 underChildPage=true 的块；
 * 这些块即 D4 的「唯一已知盲区」，由预检单独标记人工复核。
 *
 * 配对集 = out.filter(r => !r.underChildPage)，其顺序 == content.prod .md 正文图片 URL 顺序，
 * 故 ids[i] ↔ urls[i] 按索引对应。
 *
 * 图片块识别：type === 'image'，或 .parent 以 `![` 开头（兜底，防 type 未填充）。
 */
export function collectImageBlocks(mdBlocks: MdBlock[]): ImageBlockRef[] {
  const out: ImageBlockRef[] = [];
  const walk = (blocks: MdBlock[], underChildPage: boolean) => {
    for (const b of blocks) {
      const isChildPage = b.type === 'child_page';
      const isImage = b.type === 'image' || IMAGE_PARENT_RE.test(b.parent.trim());
      if (isImage) {
        const urls = extractImageUrls(b.parent);
        out.push({ blockId: b.blockId, currentUrl: urls[0] ?? null, underChildPage });
      }
      if (b.children?.length) {
        walk(b.children, underChildPage || isChildPage);
      }
    }
  };
  walk(mdBlocks, false);
  return out;
}

/**
 * 取配对集（排除 child_page 子树内图片），保持 .parent 展开顺序。
 */
export function pairableImageBlocks(refs: ImageBlockRef[]): ImageBlockRef[] {
  return refs.filter((r) => !r.underChildPage);
}

// ─── content.prod 扫描 ──────────────────────────────────────────────────────

export interface ContentProdEntry {
  /** .md 绝对路径 */
  file: string;
  /** 正文（去 frontmatter，即 notion-to-md 的 .parent） */
  body: string;
  /** taste 的 cover frontmatter（s.ee 链接）；其它库为 undefined */
  coverUrl?: string;
}

/**
 * 扫描 content.prod 下某库目录的全部 .md，按 frontmatter 的 page_id 建立映射。
 * 用 frontmatter 而非文件名定位，规避各库文件名规则不一（posts 用 slug、taste 用 pageId）。
 */
export function scanContentProd(dir: string): Map<string, ContentProdEntry> {
  const absDir = path.resolve(process.cwd(), dir);
  const map = new Map<string, ContentProdEntry>();
  if (!fs.existsSync(absDir)) return map;
  const files = fs.readdirSync(absDir).filter((f) => f.endsWith('.md'));
  for (const file of files) {
    const full = path.join(absDir, file);
    const raw = fs.readFileSync(full, 'utf-8');
    const { data, content } = matter(raw);
    const pageId = typeof data.page_id === 'string' ? data.page_id : undefined;
    if (!pageId) continue;
    const coverUrl = typeof data.cover === 'string' && data.cover ? data.cover : undefined;
    map.set(pageId, { file: full, body: content, coverUrl });
  }
  return map;
}

// ─── Notion 查询 ─────────────────────────────────────────────────────────────

/**
 * 构造 Notion 客户端（校验 NOTION_API_SECRET）。
 */
export function createNotionClient(): Client {
  const secret = process.env.NOTION_API_SECRET;
  if (!secret) {
    throw new Error('Missing required environment variable: NOTION_API_SECRET');
  }
  return new Client({ auth: secret });
}

/**
 * 分页遍历某数据源的全部页面（dataSources.query），返回 PageObjectResponse[]。
 * 镜像 migrate-smms-to-r2.ts / cleanup-r2-orphans.ts 的 queryAllPages。
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function queryAllPages(
  notion: Client,
  dataSourceId: string,
): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    // dataSources.query 不在 SDK 类型中，按既有脚本惯例 as any 调用。
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (notion as any).dataSources.query({
      data_source_id: dataSourceId,
      start_cursor: cursor,
    });
    for (const page of res.results) {
      pages.push(page as PageObjectResponse);
    }
    cursor = res.next_cursor;
  } while (cursor);
  return pages;
}

// ─── CLI 参数 ────────────────────────────────────────────────────────────────

export interface MigrationArgs {
  /** --only <label>：仅处理指定库 */
  only?: string;
  /** --limit <n>：每库仅处理前 n 个页面（试跑） */
  limit?: number;
  /** --apply：rewrite 真正回写（默认 dry-run） */
  apply: boolean;
  /** --force-domain：preflight 跳过 R2_PUBLIC_DOMAIN == cdn.varzy.me 的硬门槛（仅试跑） */
  forceDomain: boolean;
}

export function parseMigrationArgs(argv: string[]): MigrationArgs {
  const args: MigrationArgs = { apply: false, forceDomain: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--only' && argv[i + 1]) {
      args.only = argv[++i];
    } else if (a === '--limit' && argv[i + 1]) {
      const n = Number(argv[i + 1]);
      if (n > 0) args.limit = n;
      i++;
    } else if (a === '--apply') {
      args.apply = true;
    } else if (a === '--force-domain') {
      args.forceDomain = true;
    }
  }
  return args;
}

/** 按 --only 过滤目标库；未指定则全量。未知 label 报错。 */
export function selectTargets(args: Pick<MigrationArgs, 'only'>): MigrationTarget[] {
  if (!args.only) return [...MIGRATION_TARGETS];
  const found = MIGRATION_TARGETS.find((t) => t.label === args.only);
  if (!found) {
    throw new Error(
      `Unknown --only label: ${args.only}. Valid: ${MIGRATION_TARGETS.map((t) => t.label).join(', ')}`,
    );
  }
  return [found];
}

// ─── 杂项 ────────────────────────────────────────────────────────────────────

export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export { isSmmsUrl };
