#!/usr/bin/env tsx

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Client } from '@notionhq/client';
import { BlockObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import matter from 'gray-matter';
import { isSmmsUrl } from './smms-uploader';

/**
 * 恢复脚本：把 Notion 页面的图片块按文档顺序回退为本地 content/posts/*.md 记录的原始链接。
 *
 * 背景：migrate-smms-to-r2 因 extractUrlBasename 取 basename 作 R2 key，
 * 在 s.ee 对不同图片复用同一文件名（仅 URL 路径段不同）时，把多张不同图片折叠到了同一个 R2 key，
 * 导致部分页面的图片块全部指向第一张图。.md 是迁移前抓取的产物，保留原始 s.ee 链接，是恢复的唯一真源。
 *
 * 匹配策略：第 N 个 Notion 图片块 ← .md 正文中第 N 个图片 URL（按文档顺序）。
 *
 * 安全：
 * - 默认 dry-run，仅打印计划，不写 Notion。加 --apply 才真正回写。
 * - 每页数量断言：.md 图片数 != Notion 图片块数 时跳过该页（避免错位写入）。
 * - 仅当目标 URL 是 s.ee 链接（isSmmsUrl）且与当前不同时才写——绝不把过期的 Notion 签名 URL 当目标写回。
 *
 * 用法：
 *   pnpm restore:notion                 # dry-run，检查 10 个已知受影响页面
 *   pnpm restore:notion -- --apply      # 真正回写 Notion
 *   pnpm restore:notion -- --slug foo --slug bar   # 追加/指定页面
 *   pnpm restore:notion -- --limit 1    # 只处理第一个（试跑）
 */

const CONTENT_DIR = path.join(process.cwd(), 'content/posts');
const IMAGE_MD_RE = /!\[[^\]]*\]\(([^)]+)\)/g;

// 来自 pnpm-smms.txt 中 Processed>0 的页面（迁移实际写入过的）
const KNOWN_AFFECTED = [
  'my-homepage-3-1-test',
  'my-homepage-3-1',
  '13-sentinels-aegis-rim',
  'is-traffic-the-ultimate-answer-for-the-internet',
  'sans-la-liberte-de-blamer-il-nest-point-deloge-flatteur',
  'my-ai-coding-solution',
  'fucking-honkai-star-rail-37',
  'dubai-trip',
  '2025-summary',
  'trip-to-shenzhen-and-shanghai',
];

function extractImageUrls(body: string): string[] {
  const urls: string[] = [];
  let m: RegExpExecArray | null;
  IMAGE_MD_RE.lastIndex = 0;
  while ((m = IMAGE_MD_RE.exec(body)) !== null) {
    urls.push(m[1]);
  }
  return urls;
}

function currentImageUrl(block: BlockObjectResponse): string | null {
  if (block.type !== 'image') return null;
  const img = block.image;
  if (img.type === 'file') return img.file.url;
  if (img.type === 'external') return img.external.url;
  return null;
}

async function collectImageBlocks(
  notion: Client,
  blockId: string,
): Promise<{ id: string; url: string | null }[]> {
  const out: { id: string; url: string | null }[] = [];
  const walk = async (id: string, startCursor?: string): Promise<void> => {
    const res = await notion.blocks.children.list({
      block_id: id,
      start_cursor: startCursor,
    });
    for (const b of res.results as BlockObjectResponse[]) {
      if (b.type === 'image') out.push({ id: b.id, url: currentImageUrl(b) });
      if (b.has_children) await walk(b.id);
    }
    if (res.has_more && res.next_cursor) await walk(id, res.next_cursor);
  };
  await walk(blockId);
  return out;
}

async function main() {
  const notionApiSecret = process.env.NOTION_API_SECRET;
  if (!notionApiSecret) {
    throw new Error('Missing required environment variable: NOTION_API_SECRET');
  }
  const notion = new Client({ auth: notionApiSecret });

  const argv = process.argv.slice(2);
  const apply = argv.includes('--apply');
  const limitIdx = argv.indexOf('--limit');
  const limit =
    limitIdx >= 0 && argv[limitIdx + 1] && Number(argv[limitIdx + 1]) > 0
      ? Number(argv[limitIdx + 1])
      : undefined;
  const slugs: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--slug' && argv[i + 1]) slugs.push(argv[++i]);
  }
  const targets = slugs.length ? slugs : KNOWN_AFFECTED;
  const slice = limit ? targets.slice(0, limit) : targets;

  console.log(apply ? '🔴 APPLY：将回写 Notion' : '🟡 DRY-RUN：仅打印计划（加 --apply 回写）');
  console.log(`目标页面 ${slice.length} 个（共 ${targets.length}）\n`);

  let totalChanges = 0;
  let pagesWithChanges = 0;
  let pagesClean = 0;
  let pagesSkipped = 0;

  for (const slug of slice) {
    const file = path.join(CONTENT_DIR, `${slug}.md`);
    if (!fs.existsSync(file)) {
      console.warn(`⚠️  找不到 .md：${file}，跳过`);
      pagesSkipped++;
      continue;
    }

    const raw = fs.readFileSync(file, 'utf-8');
    const { data, content } = matter(raw);
    const pageId = data.page_id as string | undefined;
    if (!pageId) {
      console.warn(`⚠️  ${slug}: frontmatter 无 page_id，跳过`);
      pagesSkipped++;
      continue;
    }

    const mdUrls = extractImageUrls(content);
    const blocks = await collectImageBlocks(notion, pageId);

    if (mdUrls.length !== blocks.length) {
      console.warn(
        `⚠️  ${slug}: 数量不匹配（.md=${mdUrls.length} Notion=${blocks.length}），跳过，需手动检查`,
      );
      pagesSkipped++;
      continue;
    }

    const changes: { id: string; from: string | null; to: string }[] = [];
    for (let i = 0; i < blocks.length; i++) {
      const target = mdUrls[i];
      const current = blocks[i].url;
      if (target === current) continue;
      // 安全闸：只回写 s.ee 链接，绝不写非 s.ee（如过期的 Notion 签名 URL）
      if (!isSmmsUrl(target)) {
        console.warn(
          `⚠️  ${slug}: 块 ${blocks[i].id} 的 .md 目标非 s.ee 链接（${target}），跳过该块`,
        );
        continue;
      }
      changes.push({ id: blocks[i].id, from: current, to: target });
    }

    if (changes.length === 0) {
      console.log(`✅ ${slug}: 无差异`);
      pagesClean++;
      continue;
    }

    console.log(`\n▸ ${slug}（${changes.length} 处待回写）:`);
    for (const c of changes) {
      console.log(`   ${c.id}\n     ${c.from}\n   → ${c.to}`);
    }

    if (apply) {
      for (const c of changes) {
        await notion.blocks.update({
          block_id: c.id,
          image: { external: { url: c.to } },
        });
      }
      console.log(`   ✅ 已回写 ${changes.length} 处`);
    }

    totalChanges += changes.length;
    pagesWithChanges++;
  }

  console.log(`\n━━━ 汇总 ━━━`);
  console.log(`待回写变更：${totalChanges}（${pagesWithChanges} 页）`);
  console.log(`无差异页：${pagesClean}`);
  console.log(`跳过页：${pagesSkipped}`);
  if (!apply && totalChanges > 0) {
    console.log('\n以上为 dry-run。确认无误后执行：pnpm restore:notion -- --apply');
  } else if (apply) {
    console.log('\n✅ 回写完成。下一步可重新抓取校验：pnpm fetch:posts');
  }
}

main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
