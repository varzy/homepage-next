#!/usr/bin/env tsx

/**
 * R2 图床连通性自检（手动诊断工具，不参与构建/抓取流程）。
 *
 * 用法：pnpm verify:r2
 *
 * 做三件事：
 * 1. 向 R2 上传一张 1x1 测试 PNG（直接 PutObject，验证凭证 + endpoint + bucket）；
 * 2. 通过自定义域名 GET 该对象，验证公开可读且字节一致；
 * 3. 删除测试对象，并顺带校验过渡期 isHostedUrl 判定逻辑。
 *
 * 运行前请确保 .env 中 R2_* 五项均已填写。
 */

import 'dotenv/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { composeR2Key, isR2Url, r2ImageUploader } from './r2-uploader';

// 一张合法的 1x1 PNG（68 字节）。
const TINY_PNG_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJEjQAAAABJRU5ErkJggg==';

const die = (msg: string): never => {
  console.error(`❌ ${msg}`);
  process.exit(1);
};

const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env: ${name}`);
  }
  return v;
};

async function main(): Promise<void> {
  const accountId = requireEnv('R2_ACCOUNT_ID');
  const accessKeyId = requireEnv('R2_ACCESS_KEY_ID');
  const secretAccessKey = requireEnv('R2_SECRET_ACCESS_KEY');
  const bucket = requireEnv('R2_BUCKET_NAME');
  const publicDomain = requireEnv('R2_PUBLIC_DOMAIN').replace(/\/$/, '');

  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });

  const png = Buffer.from(TINY_PNG_B64, 'base64');
  const key = composeR2Key(`__r2_verify_${Date.now()}.png`);
  const publicUrl = `${publicDomain}/${key}`;

  console.log(`📤 PUT ${key} (${png.length} bytes) → bucket "${bucket}"...`);
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: png,
      ContentType: 'image/png',
    }),
  );
  console.log(`   uploaded. Public URL: ${publicUrl}`);

  console.log(`📥 GET via custom domain to verify public readability...`);
  const res = await fetch(publicUrl, { cache: 'no-cache' });
  if (!res.ok) die(`Public GET failed: ${res.status} ${res.statusText}`);
  const got = Buffer.from(await res.arrayBuffer());
  if (got.length !== png.length || !png.equals(got)) {
    die('Bytes mismatch — downloaded object does not match uploaded bytes');
  }
  console.log(`   ✅ readable, ${got.length} bytes match`);

  console.log(`🧹 Deleting test object ${key}...`);
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  console.log(`   deleted.`);

  // 校验过渡期 isHostedUrl 判定（R2 与历史 SMMS 链接都视为已托管）
  if (isR2Url(publicUrl) !== true) die('isR2Url(publicUrl) should be true');
  const uploader = r2ImageUploader();
  if (uploader.isHostedUrl(publicUrl) !== true) die('isHostedUrl(r2 url) should be true');
  if (uploader.isHostedUrl('https://cdn.sa.net/x.png') !== true)
    die('isHostedUrl(legacy smms url) should be true');
  if (uploader.isHostedUrl('https://example.com/x.png') !== false)
    die('isHostedUrl(other url) should be false');
  console.log('✅ isHostedUrl 过渡期判定正确（R2/SMMS 视为已托管，其他未托管）');

  console.log('\n🎉 R2 验证通过：上传、公开读取、删除、过渡期判定均正常。');
  console.log(
    '   提示：如需验证真实的 uploadExternal 下载链路，可在 Notion 新建一篇测试文章后运行 pnpm fetch:posts。',
  );
}

main().catch((e) => die(e?.message || String(e)));
