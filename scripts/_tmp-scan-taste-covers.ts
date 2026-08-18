#!/usr/bin/env tsx
// 临时只读脚本：扫描 taste 库 files 属性中指向「纯哈希 R2 key」的封面（测试残留），
// 并验证其哈希是否与已知的原始 s.ee 链接候选匹配。不写任何数据。
import 'dotenv/config';
import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { createHash } from 'node:crypto';

const R2_PUBLIC = (process.env.R2_PUBLIC_DOMAIN ?? '').replace(/\/$/, '');
const TASTE_DB = process.env.NOTION_TASTE_DATABASE_ID;

// 来自迁移日志的原始 s.ee 链接候选（372dc9c0 的两张封面）
const CANDIDATES = [
  'https://i.see.you/2026/08/07/dx5N/taste_372dc9c0_1786117612311_u8h.jpg',
  'https://i.see.you/2026/06/06/gPd4/taste_372dc9c0_1780743452090_2l6.jpg',
];
const hash16 = (url: string) => createHash('sha1').update(url).digest('hex').slice(0, 16);
const candidateByHash = new Map(CANDIDATES.map((u) => [hash16(u), u]));

async function main() {
  if (!TASTE_DB) throw new Error('NOTION_TASTE_DATABASE_ID missing');
  if (!R2_PUBLIC) throw new Error('R2_PUBLIC_DOMAIN missing');
  const notion = new Client({ auth: process.env.NOTION_API_SECRET });

  console.log('候选 s.ee → sha1-16 映射:');
  for (const u of CANDIDATES) console.log(`  ${hash16(u)}  <-  ${u}`);

  const pages: PageObjectResponse[] = [];
  let cursor: string | undefined;
  do {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await (notion as any).dataSources.query({
      data_source_id: TASTE_DB,
      start_cursor: cursor,
    });
    for (const p of res.results) pages.push(p as PageObjectResponse);
    cursor = res.next_cursor || undefined;
  } while (cursor);
  console.log(`\ntaste 页面数: ${pages.length}`);

  // 仅匹配「纯 16-hex basename」的 R2 URL（测试残留）；三级结构 key 的 basename 形如
  // posts_<id>_<hash>.jpg，不会被该正则命中（16-hex 前是 '_' 而非 '/'）。
  const r2HashRe = /\/[0-9a-f]{16}\.[a-z0-9]{1,8}$/i;
  const findings: {
    pageId: string;
    shortId: string;
    prop: string;
    r2Url: string;
    hash: string;
    restoreTo?: string;
  }[] = [];

  for (const page of pages) {
    const shortId = page.id.replace(/-/g, '').slice(0, 8);
    for (const [propName, prop] of Object.entries(page.properties)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = prop as any;
      if (p?.type !== 'files' || !Array.isArray(p.files)) continue;
      for (const f of p.files) {
        const url = f?.external?.url ?? f?.file?.url;
        if (!url || !url.startsWith(R2_PUBLIC)) continue;
        const m = url.match(r2HashRe);
        if (!m) continue;
        const hash = m[0].slice(1).split('.')[0];
        findings.push({
          pageId: page.id,
          shortId,
          prop: propName,
          r2Url: url,
          hash,
          restoreTo: candidateByHash.get(hash),
        });
      }
    }
  }

  console.log(`\n纯哈希 R2 封面（测试残留）: ${findings.length}`);
  for (const f of findings) {
    console.log(`  page ${f.shortId} (${f.pageId}) prop="${f.prop}"`);
    console.log(`    当前: ${f.r2Url}  (hash ${f.hash})`);
    console.log(`    候选: ${f.restoreTo ?? '⚠️ 无匹配候选 —— 不可自动回退'}`);
  }
  const unmatched = findings.filter((f) => !f.restoreTo);
  console.log(`\n匹配: ${findings.length - unmatched.length}  未匹配: ${unmatched.length}`);
  if (unmatched.length)
    console.log('⚠️ 存在未匹配项，请勿自动回退，需人工核对原始 s.ee 链接。');
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
