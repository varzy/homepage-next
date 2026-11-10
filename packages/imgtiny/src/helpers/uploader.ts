import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { uploadImageToSmms, type SmmsUploadResult } from './smms';

export type UploadSummary = {
  dir: string;
  total: number;
  success: number;
  failed: number;
  skipped: number;
  results: SmmsUploadResult[];
  outputJsonPath?: string;
  outputMarkdownPath?: string;
};

type PoolTask<T> = () => Promise<T>;

async function runPool<T>(tasks: Array<PoolTask<T>>, concurrency: number): Promise<T[]> {
  const results: T[] = Array.from({ length: tasks.length });
  let next = 0;

  const worker = async () => {
    while (true) {
      const idx = next++;
      if (idx >= tasks.length) return;
      const task = tasks[idx];
      if (!task) return;
      results[idx] = await task();
    }
  };

  const n = Math.max(1, Math.min(concurrency, tasks.length));
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

function toMarkdown(results: SmmsUploadResult[]): string {
  const lines: string[] = [];
  for (const r of results) {
    if (r.ok) {
      lines.push(`- ${r.filename}: ${r.url}`);
    } else {
      lines.push(`- ${r.filename}: (failed) ${r.error}`);
    }
  }
  return lines.join('\n') + '\n';
}

export async function uploadCompressedImagesToSmms(options: {
  dir: string;
  filePaths: string[];
  concurrency: number;
  outputJsonPath?: string;
  outputMarkdownPath?: string;
}): Promise<UploadSummary> {
  const { dir, filePaths, concurrency, outputJsonPath, outputMarkdownPath } = options;

  const tasks: Array<PoolTask<SmmsUploadResult>> = filePaths.map((p) => () => uploadImageToSmms(p));
  const results = await runPool(tasks, concurrency);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const r of results) {
    if (r.ok) success++;
    else if (r.code === 'file_too_large') skipped++;
    else failed++;
  }

  if (outputJsonPath) {
    const abs = resolve(process.cwd(), outputJsonPath);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, JSON.stringify(results, null, 2), 'utf-8');
  }

  if (outputMarkdownPath) {
    const abs = resolve(process.cwd(), outputMarkdownPath);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, toMarkdown(results), 'utf-8');
  }

  return {
    dir,
    total: filePaths.length,
    success,
    failed,
    skipped,
    results,
    outputJsonPath,
    outputMarkdownPath,
  };
}
