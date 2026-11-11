import { spawnSync } from 'node:child_process';
import { mkdtemp, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

it('在 --clean 删除旧产物前报告重名冲突', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'imgtiny-test-'));
  const names = ['photo.jpg', 'photo.png', 'old_compressed.jpg'];

  try {
    await Promise.all(names.map((name) => writeFile(join(dir, name), '')));
    const entry = fileURLToPath(new URL('../src/compress.ts', import.meta.url));
    const run = spawnSync(
      process.execPath,
      ['--import', 'tsx', entry, '--input', dir, '--no-keep-format', '--clean'],
      { encoding: 'utf8' },
    );

    expect(run.status).toBe(1);
    expect(run.stderr).toContain('压缩产物重名');
    expect(run.stderr).toContain('photo.jpg');
    expect(run.stderr).toContain('photo.png');
    expect((await readdir(dir)).sort()).toEqual(names.sort());
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
