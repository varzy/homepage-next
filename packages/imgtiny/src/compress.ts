import { unlink } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';
import ora from 'ora';
import { DEFAULT_DIR } from './config';
import { processImage, formatSize, type ProcessResult } from './processor';
import { prepareBatch } from './utils';

const CONCURRENCY = 4;

interface CliOptions {
  input: string;
  output?: string;
  width: string;
  quality: string;
  keepFormat: boolean;
  clean: boolean;
}

function printReport(results: ProcessResult[], startTime: number): void {
  let failures = 0;
  let originalSize = 0;
  let newSize = 0;

  for (const result of results) {
    const inputName = chalk.cyan(basename(result.input));
    if (!result.isSuccess) {
      failures++;
      console.log(chalk.red('✖'), inputName, '|', chalk.red(`失败: ${result.error}`));
      continue;
    }

    originalSize += result.originalSize;
    newSize += result.newSize;
    const outputName = chalk.cyan(basename(result.output));
    const sizes = chalk.yellow(
      `${formatSize(result.originalSize)} -> ${formatSize(result.newSize)}`,
    );
    const ratio = ((1 - result.newSize / result.originalSize) * 100).toFixed(1);
    console.log(
      chalk.green('✔'),
      `${inputName} -> ${outputName} | ${sizes}`,
      chalk.gray(`(-${ratio}%)`),
    );
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(chalk.gray('\n--------------------------------------------------'));
  console.log(chalk.bold(`处理完成！耗时 ${duration} 秒`));
  console.log(`成功: ${chalk.green(results.length - failures)} | 失败: ${chalk.red(failures)}`);

  if (originalSize > 0) {
    const ratio = ((1 - newSize / originalSize) * 100).toFixed(1);
    console.log(
      `总体积: ${chalk.yellow(formatSize(originalSize))} -> ${chalk.green(formatSize(newSize))} (减小了 ${ratio}%)`,
    );
  }
  console.log('');
  if (failures > 0) process.exitCode = 1;
}

async function compressBatch(options: CliOptions): Promise<void> {
  const startTime = Date.now();
  const spinner = ora();

  try {
    // pnpm --filter 从包目录运行脚本，相对参数仍以调用目录为准。
    const invocationDir = process.env.INIT_CWD ?? process.cwd();
    const inputDir = resolve(invocationDir, options.input);
    const outputDir = options.output ? resolve(invocationDir, options.output) : inputDir;
    const maxWidth = Number(options.width);
    const quality = Number(options.quality);
    const { keepFormat, clean } = options;

    if (!Number.isSafeInteger(maxWidth) || maxWidth < 1) {
      throw new Error('--width 必须是正整数');
    }
    if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
      throw new Error('--quality 必须是 1 到 100 之间的整数');
    }

    console.log(chalk.blue.bold('\n📷 Blog Image Zipper - 图片批量压缩工具\n'));
    console.log(chalk.gray(`输入目录: ${inputDir}`));
    console.log(chalk.gray(`输出目录: ${outputDir}`));
    console.log(chalk.gray(`最大宽度: ${maxWidth}px`));
    console.log(chalk.gray(`目标质量: ${quality}`));
    console.log(chalk.gray(`保持格式: ${keepFormat ? '是' : '否 (转为 WebP)'}`));
    console.log(chalk.gray(`强制清理: ${clean ? '是' : '否'}\n`));

    spinner.start('正在扫描图片...');
    const { images, skippedCount, filesToClean } = await prepareBatch(inputDir, outputDir, clean);
    const total = images.length + skippedCount;
    if (total === 0) {
      spinner.fail(chalk.yellow(`未在输入目录 "${inputDir}" 中找到支持的图片文件。`));
      return;
    }

    if (filesToClean.length > 0) {
      spinner.text = `正在清理 ${filesToClean.length} 个旧的压缩文件...`;
      await Promise.all(filesToClean.map((file) => unlink(file)));
    }

    const status =
      images.length === 0
        ? `所有 ${total} 张图片都已存在压缩版本，无需处理。`
        : `找到 ${images.length} 张需要处理的图片 (共 ${total} 张)...`;
    spinner.succeed(chalk.green(status));
    if (skippedCount > 0) {
      console.log(chalk.gray(`(已跳过 ${skippedCount} 张现有压缩图片)`));
    }
    if (images.length === 0) return;

    const results: ProcessResult[] = [];
    for (let i = 0; i < images.length; i += CONCURRENCY) {
      const chunk = images.slice(i, i + CONCURRENCY);
      spinner.start(`正在处理第 ${i + 1} - ${i + chunk.length} / ${images.length} 张...`);
      const batch = await Promise.all(
        chunk.map((inputPath) =>
          processImage({ inputPath, outputDir, maxWidth, quality, keepFormat }),
        ),
      );
      results.push(...batch);
    }

    spinner.stop();
    console.log('');
    printReport(results, startTime);
  } catch (error) {
    spinner.fail(chalk.red(`压缩失败: ${error instanceof Error ? error.message : String(error)}`));
    process.exitCode = 1;
  }
}

await new Command()
  .name('blog-img-zipper')
  .description('批量压缩图片用于博客展示，大图变小图，质量保持')
  .option('-i, --input <path>', '输入文件夹路径', DEFAULT_DIR)
  .option('-o, --output <path>', '输出文件夹路径 (默认: 输入文件夹)')
  .option('-w, --width <number>', '最大宽度 (px)', '1920')
  .option('-q, --quality <number>', '图片质量 (1-100)', '90')
  .option('-k, --keep-format', '保持原图片格式（默认）', true)
  .option('--no-keep-format', '转换为 WebP')
  .option('-c, --clean', '强制清空输出目录中的已压缩图片', false)
  .action(compressBatch)
  .parseAsync();
