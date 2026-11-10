// Extracted from src/smms.ts — not used in the main release pipeline.
// smmsUpload is used by image-processor.ts instead.

import { smmsUpload } from '../../src/smms.ts';
import type { SmmsUploadResult } from '../../src/smms.ts';

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function smmsUploadFromUrl(
  url: string,
  fileName: string,
): Promise<SmmsUploadResult> {
  const downloadResponse = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; No2TG2/1.0)',
    },
  });

  if (!downloadResponse.ok) {
    throw new Error(
      `下载图片失败：${url}（HTTP ${downloadResponse.status}）`,
    );
  }

  const arrayBuffer = await downloadResponse.arrayBuffer();

  if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
    throw new Error(
      `图片过大：${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB（最大: 5MB）`,
    );
  }

  return smmsUpload(Buffer.from(arrayBuffer), fileName);
}
