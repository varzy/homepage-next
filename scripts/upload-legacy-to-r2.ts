#!/usr/bin/env tsx
/**
 * Step 2 上传：把本地缓存 tmp/see-cache/* 原样上传到 R2，key = 文件相对路径（即 legacy/...）。
 *
 * key 绕过 composeR2Key（它带 R2_KEY_PREFIX=images），直接用裸 legacy/ 路径，与未来新图并存于同桶不同前缀。
 * 幂等：上传前 HeadObject 探测，已存在跳过（复用 r2-uploader 的 is404 / getContentType / createR2S3Client）。
 * 上传后抽样 GET 公开 URL 校验字节一致。
 *
 * 用法：
 *   pnpm migrate:upload
 *   pnpm migrate:upload -- --limit 10
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getR2PublicDomain, parseMigrationArgs } from './r2-migration-utils';
import { createR2S3Client, getR2Bucket, getContentType, is404 } from './r2-uploader';

const CACHE_ROOT = path.resolve(process.cwd(), 'tmp/see-cache');
const CONCURRENCY = 8;
const VERIFY_SAMPLES = 5;

interface UploadResult {
  key: string;
  ok: boolean;
  status: string;
  bytes?: number;
}

function listCacheFiles(root: string): string[] {
  if (!fs.existsSync(root)) return [];
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.isFile() && !e.name.startsWith('_')) out.push(full);
    }
  };
  walk(root);
  return out;
}

async function uploadOne(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  bucket: string,
  file: string,
): Promise<UploadResult> {
  const key = path.relative(CACHE_ROOT, file);
  try {
    // 幂等：存在则跳过
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
      return { key, ok: true, status: 'skipped' };
    } catch (e) {
      if (!is404(e)) throw e;
    }
    const buf = fs.readFileSync(file);
    const contentType = getContentType(key);
    await client.send(
      new PutObjectCommand({ Bucket: bucket, Key: key, Body: buf, ContentType: contentType }),
    );
    return { key, ok: true, status: 'uploaded', bytes: buf.length };
  } catch (e) {
    return { key, ok: false, status: e instanceof Error ? e.message : String(e) };
  }
}

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

function pickRandom<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0 && n > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

async function verifySamples(files: string[]): Promise<{ checked: number; ok: number }> {
  const samples = pickRandom(files, VERIFY_SAMPLES);
  let ok = 0;
  const base = getR2PublicDomain();
  for (const f of samples) {
    const key = path.relative(CACHE_ROOT, f);
    const publicUrl = `${base}/${key}`;
    try {
      const r = await fetch(publicUrl);
      if (!r.ok) {
        console.warn(`   ⚠️  verify GET ${r.status}: ${publicUrl}`);
        continue;
      }
      const got = Buffer.from(await r.arrayBuffer());
      const local = fs.readFileSync(f);
      if (got.equals(local)) ok++;
      else console.warn(`   ⚠️  verify 字节不一致: ${publicUrl}`);
    } catch (e) {
      console.warn(
        `   ⚠️  verify 异常 ${publicUrl}: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }
  return { checked: samples.length, ok };
}

async function main() {
  const args = parseMigrationArgs(process.argv.slice(2));

  console.log('━'.repeat(60));
  console.log('📤 上传本地缓存到 R2 /legacy/');
  console.log('━'.repeat(60));

  let files = listCacheFiles(CACHE_ROOT);
  if (files.length === 0) {
    console.warn(`❌ 缓存目录为空：${CACHE_ROOT}（先运行 pnpm migrate:download）`);
    process.exit(1);
  }
  if (args.limit) files = files.slice(0, args.limit);
  console.log(`待上传：${files.length} 个文件（并发 ${CONCURRENCY}）`);

  const client = createR2S3Client();
  const bucket = getR2Bucket();

  const results = await runPool(files, (f) => uploadOne(client, bucket, f), CONCURRENCY);

  const uploaded = results.filter((r) => r.ok && r.status === 'uploaded').length;
  const skipped = results.filter((r) => r.ok && r.status === 'skipped').length;
  const failed = results.filter((r) => !r.ok);

  if (failed.length > 0) {
    console.warn(`\n⚠️  ${failed.length} 个上传失败：`);
    for (const r of failed.slice(0, 20)) console.warn(`   ${r.key}: ${r.status}`);
    if (failed.length > 20) console.warn(`   ... 还有 ${failed.length - 20} 条`);
  }

  // 抽样校验
  const verify = await verifySamples(files);
  console.log(`\n✅ 完成：上传 ${uploaded}，跳过 ${skipped}，失败 ${failed.length}`);
  console.log(`   抽样校验：${verify.ok}/${verify.checked} 字节一致`);
  if (failed.length > 0) {
    console.log('可重跑补失败项：pnpm migrate:upload');
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('💥 Upload failed:', error);
  process.exit(1);
});
