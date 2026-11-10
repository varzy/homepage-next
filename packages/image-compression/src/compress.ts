import sharp from 'sharp';

import { heicToJpeg, isHeic } from './heic.ts';

const DEFAULT_MAX_DIMENSION = 1920;
const DEFAULT_QUALITY = 80;

/** 输出格式：浏览器（Notion）与 Telegram 都能直接显示的格式。 */
export type OutputFormat = 'jpeg' | 'png' | 'webp' | 'gif' | 'avif' | 'tiff';
export type InputFormat = OutputFormat | 'heic' | 'unknown';

export interface CompressedImage {
  buffer: Buffer;
  format: OutputFormat;
  /** 与实际字节匹配的扩展名（不含点），用于 R2 key 与上传文件名 */
  ext: string;
  contentType: string;
}

export interface CompressOptions {
  /** auto：保持原格式（HEIC 转 JPEG、GIF 原样保留）；webp：一律重编码为 WebP（imgtiny 非 keepFormat 路径） */
  output?: 'auto' | 'webp';
  /** 最长边上限（px），默认 1920 */
  maxDimension?: number;
  /** 有损质量 1-100，默认 80 */
  quality?: number;
}

const OUTPUT_INFO: Record<OutputFormat, { ext: string; contentType: string }> = {
  jpeg: { ext: 'jpg', contentType: 'image/jpeg' },
  png: { ext: 'png', contentType: 'image/png' },
  webp: { ext: 'webp', contentType: 'image/webp' },
  gif: { ext: 'gif', contentType: 'image/gif' },
  avif: { ext: 'avif', contentType: 'image/avif' },
  tiff: { ext: 'tiff', contentType: 'image/tiff' },
};

/** 按文件头魔数识别图片格式。Notion/R2 的 URL 扩展名与 content-type 都不可靠。 */
export function detectImageFormat(buffer: Buffer): InputFormat {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }
  if (buffer.length >= 8 && buffer.readUInt32BE(0) === 0x89504e47) return 'png';
  if (buffer.length >= 6 && buffer.toString('latin1', 0, 4) === 'GIF8') return 'gif';
  if (
    buffer.length >= 12 &&
    buffer.toString('latin1', 0, 4) === 'RIFF' &&
    buffer.toString('latin1', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  // TIFF：II*\0（小端）或 MM\0*（大端）
  if (
    buffer.length >= 4 &&
    ((buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a && buffer[3] === 0x00) ||
      (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00 && buffer[3] === 0x2a))
  ) {
    return 'tiff';
  }
  // AVIF：ftyp box 的 major brand 在偏移 8；mif1 等 HEIF 通用 brand 交给 isHeic，避免歧义
  if (
    buffer.length >= 12 &&
    buffer.toString('latin1', 4, 8) === 'ftyp' &&
    ['avif', 'avis'].includes(buffer.toString('latin1', 8, 12))
  ) {
    return 'avif';
  }
  if (isHeic(buffer)) return 'heic';
  return 'unknown';
}

function result(buffer: Buffer, format: OutputFormat): CompressedImage {
  return { buffer, format, ...OUTPUT_INFO[format] };
}

/**
 * 从 JPEG 字节中剥离 MPF 关联的次级图片（如 iPhone Ultra HDR 的 gain map）。
 *
 * Ultra HDR JPEG 在主图 EOI 之后追加一张 gain map。部分 libvips 构建在处理带
 * gain map 的 JPEG 时会走 libheif 代码路径，触发「iref box 引用数超过安全限制」
 * 之类的错误导致解码失败（observed on sharp 0.35.3 / ubuntu-latest）。
 *
 * 剥离后只保留主图，libvips 仅按 JPEG 解码，输出仍是标准 SDR JPEG——gain map 仅
 * 用于 HDR 显示，我们本就重新编码为 SDR，丢弃它无损画质。
 *
 * 解析方式：按 JPEG 段标记逐段跳过（含 Exif 缩略图所在 APP1 段，整体按长度跳过），
 * 直到 SOS 后的熵编码数据首个非填充标记；遇到主图 EOI 即截断其后所有次级图片。
 * 非多图 JPEG（EOI 即文件末尾）原样返回；非 JPEG 一律原样返回。
 */
export function stripJpegSecondaryImages(buffer: Buffer): Buffer {
  if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8) return buffer;

  let offset = 2; // 跳过 SOI
  while (offset + 1 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buffer[offset + 1] ?? -1;

    // 填充字节 FF00 与 TEM(01) 无长度字段
    if (marker === 0x00 || marker === 0x01) {
      offset += 2;
      continue;
    }
    // RSTn(D0-D7) 独立标记，无长度
    if (marker >= 0xd0 && marker <= 0xd7) {
      offset += 2;
      continue;
    }
    // EOI(D9)：主图结束，其后若有数据即为次级图片，截断
    if (marker === 0xd9) {
      const end = offset + 2;
      return end >= buffer.length ? buffer : buffer.subarray(0, end);
    }
    // SOS(DA)：段头之后是熵编码数据，扫描到下一个非填充标记（通常为 EOI）
    if (marker === 0xda) {
      const segLen = buffer.readUInt16BE(offset + 2);
      offset += 2 + segLen; // 跳过 SOS 段头，进入熵编码数据
      while (offset + 1 < buffer.length) {
        if (buffer[offset] === 0xff && buffer[offset + 1] !== 0x00) {
          const m = buffer[offset + 1] ?? -1;
          // RSTn 仍属熵编码流，越过继续扫描
          if (m >= 0xd0 && m <= 0xd7) {
            offset += 2;
            continue;
          }
          break;
        }
        offset++;
      }
      continue;
    }
    // 其余段(APPn/COM/DQT/DHT/SOFn...)：读 2 字节长度后整体跳过
    if (offset + 3 >= buffer.length) return buffer;
    const segLen = buffer.readUInt16BE(offset + 2);
    offset += 2 + segLen;
  }
  return buffer;
}

async function compressWithSharp(
  buffer: Buffer,
  inputFormat: InputFormat,
  label: string,
  opts: Required<CompressOptions>,
): Promise<CompressedImage> {
  // GIF 可能是动图，sharp 处理动图效果不佳，auto 模式原样保留
  if (inputFormat === 'gif' && opts.output === 'auto') return result(buffer, 'gif');

  const source =
    inputFormat === 'heic'
      ? await heicToJpeg(buffer, opts.maxDimension)
      : stripJpegSecondaryImages(buffer);
  const image = sharp(source);
  const metadata = await image.metadata();

  // Apply EXIF orientation (e.g. phone photos taken in portrait) so the correct
  // orientation is baked into the pixels. Otherwise sharp strips the EXIF tag on
  // re-encode while leaving the pixels un-rotated, making the image appear sideways.
  image.rotate();

  // Resize only if the image exceeds max dimension
  if (
    metadata.width &&
    metadata.height &&
    (metadata.width > opts.maxDimension || metadata.height > opts.maxDimension)
  ) {
    image.resize(opts.maxDimension, opts.maxDimension, { fit: 'inside', withoutEnlargement: true });
  }

  // auto 模式保持原格式（PNG/WebP/AVIF/TIFF，截图、透明图），其余（JPEG、HEIC）统一
  // 输出 JPEG；webp 模式一律重编码为 WebP。
  // sharp 默认会把带 ICC 的输入（如 Display P3）转换到 sRGB 再输出。
  let output: CompressedImage;
  if (opts.output === 'webp') {
    output = result(await image.webp({ quality: opts.quality }).toBuffer(), 'webp');
  } else {
    switch (inputFormat) {
      case 'png':
        output = result(await image.png({ quality: opts.quality }).toBuffer(), 'png');
        break;
      case 'webp':
        output = result(await image.webp({ quality: opts.quality }).toBuffer(), 'webp');
        break;
      case 'avif':
        output = result(await image.avif({ quality: opts.quality }).toBuffer(), 'avif');
        break;
      case 'tiff':
        output = result(await image.tiff({ quality: opts.quality }).toBuffer(), 'tiff');
        break;
      default:
        output = result(
          await image.jpeg({ quality: opts.quality, mozjpeg: true }).toBuffer(),
          'jpeg',
        );
    }
  }

  // 集中记录压缩结果，覆盖 R2 处理与 Telegram 上传两条路径。format/dims/尺寸是
  // 图片问题的首要诊断信息（如 Ultra HDR gain map、解码失败、尺寸异常等）。
  console.log(
    `图片压缩完成 ${label}: ${inputFormat}→${output.format} ${metadata.width}x${metadata.height} ${buffer.length}→${output.buffer.length}B`,
  );

  return output;
}

/**
 * 压缩并规范化图片：缩放到 maxDimension 内、应用 EXIF 朝向、HEIC 转 JPEG。
 *
 * 失败时仅当原图本身是浏览器/Telegram 可直接显示的格式才回退原图；HEIC 等格式
 * 原样上传必然被 Telegram 拒绝（IMAGE_PROCESS_FAILED），因此直接抛错。
 */
export async function compressImage(
  buffer: Buffer,
  label: string,
  options?: CompressOptions,
): Promise<CompressedImage> {
  const opts: Required<CompressOptions> = {
    output: options?.output ?? 'auto',
    maxDimension: options?.maxDimension ?? DEFAULT_MAX_DIMENSION,
    quality: options?.quality ?? DEFAULT_QUALITY,
  };
  const inputFormat = detectImageFormat(buffer);
  try {
    return await compressWithSharp(buffer, inputFormat, label, opts);
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    if (inputFormat === 'heic' || inputFormat === 'unknown') {
      throw new Error(`图片处理失败（${label}，格式 ${inputFormat}）：${error}`, { cause: err });
    }
    console.warn(`图片压缩失败，回退原图: ${label} (${inputFormat}) ${error}`);
    return result(buffer, inputFormat);
  }
}
