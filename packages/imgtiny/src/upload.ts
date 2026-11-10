import 'dotenv/config';
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve } from 'node:path';
import { findCompressedImages } from './helpers/utils';
import { uploadCompressedImagesToSmms } from './helpers/uploader';
import { DEFAULT_DIR, SMMS_TOKEN } from './helpers/config';

const program = new Command();

program
  .name('blog-img-zipper-upload')
  .description('将压缩后的图片（*_compressed.*）批量上传至 sm.ms 图床')
  .option('-d, --dir <path>', '包含压缩后图片的目录', DEFAULT_DIR)
  .option('-c, --concurrency <number>', '并发数', '3')
  .option('--json <path>', '保存上传结果为 JSON (相对/绝对路径)', 'upload-result.smms.json')
  .option('--md <path>', '保存上传结果为 Markdown (相对/绝对路径)', 'upload-result.smms.md')
  .action(async (options) => {
    if (!SMMS_TOKEN) {
      console.error(chalk.red('缺少 SMMS_TOKEN：请在 packages/imgtiny/.env 中配置'));
      process.exit(1);
    }

    const dir = resolve(process.cwd(), options.dir);
    const concurrency = Math.max(1, parseInt(options.concurrency, 10) || 1);

    console.log(chalk.blue.bold('\n☁️  SM.MS Uploader - 压缩图片批量上传\n'));
    console.log(chalk.gray(`目录: ${dir}`));
    console.log(chalk.gray(`并发: ${concurrency}`));
    console.log(chalk.gray(`结果 JSON: ${options.json}`));
    console.log(chalk.gray(`结果 Markdown: ${options.md}`));
    console.log('');

    const spinner = ora('正在扫描压缩后的图片...').start();
    try {
      const files = await findCompressedImages(dir);
      if (files.length === 0) {
        spinner.fail(chalk.yellow(`未在目录 "${dir}" 中找到 *_compressed 的图片文件。`));
        return;
      }
      spinner.succeed(chalk.green(`找到 ${files.length} 张压缩后的图片，准备上传...`));

      const uploadSpinner = ora('正在上传...').start();
      const summary = await uploadCompressedImagesToSmms({
        dir,
        filePaths: files,
        concurrency,
        outputJsonPath: options.json,
        outputMarkdownPath: options.md,
      });
      uploadSpinner.stop();

      console.log(chalk.gray('\n--------------------------------------------------'));
      console.log(
        `总计: ${chalk.cyan(summary.total)} | 成功: ${chalk.green(summary.success)} | 失败: ${chalk.red(summary.failed)} | 跳过: ${chalk.yellow(summary.skipped)}`,
      );
      console.log(chalk.gray(`已写入: ${options.json}`));
      console.log(chalk.gray(`已写入: ${options.md}`));
      console.log('');
    } catch (e: any) {
      spinner.fail(chalk.red(`扫描/上传失败: ${e?.message || String(e)}`));
      process.exit(1);
    }
  });

program.parse();
