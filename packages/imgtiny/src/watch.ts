import { watch } from 'chokidar';
import { Command } from 'commander';
import chalk from 'chalk';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { DEFAULT_DIR } from './helpers/config';

const SUPPORTED_EXTS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.avif',
  '.tiff',
  '.tif',
]);

const program = new Command();

program
  .name('blog-img-zipper-watch')
  .description('监听目录，自动压缩新图片')
  .option('-i, --input <path>', '监听的文件夹路径', DEFAULT_DIR)
  .action((options) => {
    const inputDir = resolve(process.cwd(), options.input);

    console.log(chalk.blue.bold('\n👁  Blog Image Zipper - 监听模式\n'));
    console.log(chalk.gray(`监听目录: ${inputDir}`));
    console.log(chalk.gray('等待新图片文件...\n'));

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const watcher = watch(inputDir, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
    });

    watcher.on('add', (filePath) => {
      const lower = filePath.toLowerCase();
      const ext = lower.slice(lower.lastIndexOf('.'));

      if (!SUPPORTED_EXTS.has(ext)) return;
      // 跳过已经压缩过的文件
      if (lower.includes('_compressed')) return;

      console.log(chalk.cyan(`[${new Date().toLocaleTimeString()}] 检测到新文件: ${filePath}`));

      // 防抖：批量新增时只触发一次压缩
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log(chalk.yellow('\n▶ 开始压缩...\n'));
        const proc = spawn('tsx', ['src/compress.ts', '--input', inputDir], { stdio: 'inherit' });
        proc.on('close', (code) => {
          if (code === 0) {
            console.log(chalk.green('\n✔ 压缩完成，继续监听...\n'));
          } else {
            console.log(chalk.red(`\n✖ 压缩失败 (exit ${code})，继续监听...\n`));
          }
        });
      }, 800);
    });

    watcher.on('error', (err) => {
      console.error(chalk.red(`监听错误: ${err instanceof Error ? err.message : String(err)}`));
    });

    process.on('SIGINT', () => {
      console.log(chalk.gray('\n停止监听。'));
      watcher.close();
      process.exit(0);
    });
  });

program.parse();
