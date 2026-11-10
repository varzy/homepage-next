import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { resolve, parse } from 'node:path';
import { unlink, readdir } from 'node:fs/promises';
import { findImages, findCompressedImages } from './helpers/utils';
import { processImage, formatSize, type ProcessResult } from './helpers/processor';
import { DEFAULT_DIR } from './helpers/config';

const program = new Command();

program
  .name('blog-img-zipper')
  .description('批量压缩图片用于博客展示，大图变小图，质量保持')
  .option('-i, --input <path>', '输入文件夹路径', DEFAULT_DIR)
  .option('-o, --output <path>', '输出文件夹路径 (默认: 输入文件夹)')
  .option('-w, --width <number>', '最大宽度 (px)', '1920')
  .option('-q, --quality <number>', '图片质量 (1-100)', '90')
  .option('-k, --keep-format', '保持原图片格式 (默认转换为 WebP)', true)
  .option('-c, --clean', '强制清空输出目录中的已压缩图片', false)
  .action(async (options) => {
    try {
      const startTime = Date.now();
      // 如果 options.input 是绝对路径 (如默认值), resolve 会直接返回它
      // 如果是相对路径, 则相对于当前工作目录解析
      const inputDir = resolve(process.cwd(), options.input);
      // 如果没有指定输出目录，则默认输出到输入目录
      const outputDir = options.output ? resolve(process.cwd(), options.output) : inputDir;

      const maxWidth = parseInt(options.width, 10);
      const quality = parseInt(options.quality, 10);
      const keepFormat = options.keepFormat;
      const clean = options.clean;

      console.log(chalk.blue.bold('\n📷 Blog Image Zipper - 图片批量压缩工具\n'));
      console.log(chalk.gray(`输入目录: ${inputDir}`));
      console.log(chalk.gray(`输出目录: ${outputDir}`));
      console.log(chalk.gray(`最大宽度: ${maxWidth}px`));
      console.log(chalk.gray(`目标质量: ${quality}`));
      console.log(chalk.gray(`保持格式: ${keepFormat ? '是' : '否 (转为 WebP)'}`));
      console.log(chalk.gray(`强制清理: ${clean ? '是' : '否'}`));
      console.log(''); // 空行

      const spinner = ora('正在扫描图片...').start();

      try {
        // 如果开启了清理选项，则清理旧的压缩文件
        if (clean) {
          const oldCompressedFiles = await findCompressedImages(outputDir);
          if (oldCompressedFiles.length > 0) {
            spinner.text = `正在清理 ${oldCompressedFiles.length} 个旧的压缩文件...`;
            await Promise.all(oldCompressedFiles.map((file) => unlink(file).catch(() => {})));
          }
        }

        const allImages = await findImages(inputDir);

        if (allImages.length === 0) {
          spinner.fail(chalk.yellow(`未在输入目录 "${inputDir}" 中找到支持的图片文件。`));
          return;
        }

        // 输出扩展名取决于压缩后的实际格式（如 HEIC→JPG），无法预知，
        // 改用前缀判断是否已有压缩产物
        const existingFiles = await readdir(outputDir).catch(() => [] as string[]);

        const images: string[] = [];
        let skippedCount = 0;

        for (const img of allImages) {
          // shortcut: 同名不同扩展（a.heic 与 a.jpg）会互相误判已压缩，重名场景罕见
          const alreadyCompressed = existingFiles.some((name) =>
            name.startsWith(`${parse(img).name}_compressed`),
          );

          if (alreadyCompressed) {
            skippedCount++;
          } else {
            images.push(img);
          }
        }

        if (images.length === 0) {
          spinner.succeed(
            chalk.green(`所有 ${allImages.length} 张图片都已存在压缩版本，无需处理。`),
          );
          if (skippedCount > 0) {
            console.log(chalk.gray(`(已跳过 ${skippedCount} 张现有压缩图片)`));
          }
          return;
        }

        spinner.succeed(
          chalk.green(`找到 ${images.length} 张需要处理的图片 (共 ${allImages.length} 张)...`),
        );
        if (skippedCount > 0) {
          console.log(chalk.gray(`(已跳过 ${skippedCount} 张现有压缩图片)`));
        }

        let successCount = 0;
        let failCount = 0;
        let totalOriginalSize = 0;
        let totalNewSize = 0;

        // 使用 for...of 循环顺序处理，或者 Promise.all 并发处理
        // 考虑到大图处理占用内存，限制并发数为 5 比较稳妥
        // 这里为了简单和进度显示，先使用简单的并发控制
        const CONCURRENCY = 4;
        const results: ProcessResult[] = [];

        // 分块处理
        for (let i = 0; i < images.length; i += CONCURRENCY) {
          const chunk = images.slice(i, i + CONCURRENCY);
          const promises = chunk.map((img) =>
            processImage({
              inputPath: img,
              outputDir,
              maxWidth,
              quality,
              keepFormat,
            }),
          );

          spinner.text = `正在处理第 ${i + 1} - ${Math.min(i + CONCURRENCY, images.length)} / ${images.length} 张...`;

          const chunkResults = await Promise.all(promises);
          results.push(...chunkResults);
        }

        spinner.stop();

        console.log(''); // 空行

        // 打印详细结果
        results.forEach((res) => {
          if (res.isSuccess) {
            successCount++;
            totalOriginalSize += res.originalSize;
            totalNewSize += res.newSize;
            const compressionRatio = ((1 - res.newSize / res.originalSize) * 100).toFixed(1);

            // 获取文件名用于显示
            const inputName = res.input.split('/').pop();
            const outputName = res.output.split('/').pop();

            console.log(
              chalk.green('✔') +
                ' ' +
                chalk.cyan(inputName) +
                ' -> ' +
                chalk.cyan(outputName) +
                ' | ' +
                chalk.yellow(`${formatSize(res.originalSize)} -> ${formatSize(res.newSize)}`) +
                ' ' +
                chalk.gray(`(-${compressionRatio}%)`),
            );
          } else {
            failCount++;
            console.log(
              chalk.red('✖') +
                ' ' +
                chalk.cyan(res.input.split('/').pop()) +
                ' | ' +
                chalk.red(`失败: ${res.error}`),
            );
          }
        });

        const endTime = Date.now();
        const duration = ((endTime - startTime) / 1000).toFixed(2);
        const totalRatio =
          totalOriginalSize > 0 ? ((1 - totalNewSize / totalOriginalSize) * 100).toFixed(1) : '0.0';

        console.log(chalk.gray('\n--------------------------------------------------'));
        console.log(chalk.bold(`处理完成！耗时 ${duration} 秒`));
        console.log(`成功: ${chalk.green(successCount)} | 失败: ${chalk.red(failCount)}`);

        if (totalOriginalSize > 0) {
          console.log(
            `总体积: ${chalk.yellow(formatSize(totalOriginalSize))} -> ${chalk.green(formatSize(totalNewSize))} (减小了 ${totalRatio}%)`,
          );
        }
        console.log('');
      } catch (err: any) {
        spinner.fail(chalk.red(`读取目录失败: ${err.message}`));
      }
    } catch (error: any) {
      console.error(chalk.red('\n发生未知错误:'));
      console.error(error);
      process.exit(1);
    }
  });

program.parse();
