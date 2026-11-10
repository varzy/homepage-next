import { basename } from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { SMMS_TOKEN } from './config';

export type SmmsUploadOk = {
  ok: true;
  filePath: string;
  filename: string;
  url: string;
  delete?: string;
  hash?: string;
  raw: unknown;
  note?: string;
};

export type SmmsUploadFail = {
  ok: false;
  filePath: string;
  filename: string;
  error: string;
  code?: string;
  raw?: unknown;
};

export type SmmsUploadResult = SmmsUploadOk | SmmsUploadFail;

const SMMS_UPLOAD_ENDPOINT = 'https://sm.ms/api/v2/upload';
const SMMS_MAX_BYTES = 5 * 1024 * 1024; // 5MB (文档常见限制)

function asString(x: unknown): string | undefined {
  return typeof x === 'string' ? x : undefined;
}

function pickUrlFromRepeated(resp: any): string | undefined {
  // 常见：{ success: false, code: "image_repeated", images: "https://..." }
  // 或者 images: ["https://..."]
  const images = resp?.images;
  if (typeof images === 'string') return images;
  if (Array.isArray(images) && typeof images[0] === 'string') return images[0];
  return undefined;
}

function pickUrlFromData(resp: any): { url?: string; delete?: string; hash?: string } {
  const data = resp?.data;
  if (!data || typeof data !== 'object') return {};
  return {
    url: asString((data as any).url),
    delete: asString((data as any).delete),
    hash: asString((data as any).hash),
  };
}

/**
 * 上传单张图片到 sm.ms（v2 upload）
 * - endpoint: POST https://sm.ms/api/v2/upload
 * - header: Authorization: <token>
 * - form: smfile=<file>
 *
 * 参考：sm.ms 官方文档 `https://doc.sm.ms/`
 */
export async function uploadImageToSmms(filePath: string): Promise<SmmsUploadResult> {
  const filename = basename(filePath);

  if (!SMMS_TOKEN || SMMS_TOKEN.trim().length === 0) {
    return { ok: false, filePath, filename, error: 'SMMS_TOKEN 为空：请检查 src/config.ts' };
  }

  let size = 0;
  try {
    const s = await stat(filePath);
    size = s.size;
  } catch (e: any) {
    return { ok: false, filePath, filename, error: `读取文件失败: ${e?.message || String(e)}` };
  }

  if (size > SMMS_MAX_BYTES) {
    return {
      ok: false,
      filePath,
      filename,
      error: `文件超过 5MB，已跳过 (${size} bytes)`,
      code: 'file_too_large',
    };
  }

  try {
    const buf = await readFile(filePath);
    const form = new FormData();
    // Node/Bun 的 fetch/FormData 都支持 Blob + filename
    const blob = new Blob([buf]);
    form.append('smfile', blob, filename);

    const res = await fetch(SMMS_UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: SMMS_TOKEN,
      },
      body: form,
    });

    const rawText = await res.text();
    let json: any;
    try {
      json = JSON.parse(rawText);
    } catch {
      return {
        ok: false,
        filePath,
        filename,
        error: `响应不是 JSON (HTTP ${res.status})`,
        raw: rawText,
      };
    }

    // 兼容常见结构：success=true；或 code=success
    const success = json?.success === true || json?.code === 'success' || json?.code === 'ok';

    if (success) {
      const picked = pickUrlFromData(json);
      if (!picked.url) {
        return {
          ok: false,
          filePath,
          filename,
          error: '上传成功但未解析到 url 字段（请对照 sm.ms 返回结构调整解析）',
          raw: json,
        };
      }
      return {
        ok: true,
        filePath,
        filename,
        url: picked.url,
        delete: picked.delete,
        hash: picked.hash,
        raw: json,
      };
    }

    // 常见：重复图片
    if (json?.code === 'image_repeated') {
      const repeatedUrl = pickUrlFromRepeated(json);
      if (repeatedUrl) {
        return {
          ok: true,
          filePath,
          filename,
          url: repeatedUrl,
          raw: json,
          note: 'image_repeated',
        };
      }
    }

    const msg =
      asString(json?.message) ||
      asString(json?.msg) ||
      asString(json?.error) ||
      `上传失败 (HTTP ${res.status})`;

    return {
      ok: false,
      filePath,
      filename,
      error: msg,
      code: asString(json?.code),
      raw: json,
    };
  } catch (e: any) {
    return { ok: false, filePath, filename, error: e?.message || String(e) };
  }
}
