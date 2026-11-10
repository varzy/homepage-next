import decode from 'heic-decode';
import sharp from 'sharp';

import { logger } from './logger.ts';

/**
 * HEVC 编码的 HEIF 品牌（ftyp major/compatible brand）。
 * 不含 mif1/avif：AVIF 同属 HEIF 容器，但 sharp 自带 AV1 解码器，无需走这里。
 */
const HEVC_BRANDS = new Set(['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'hevm', 'hevs']);

/** 按文件头魔数判断是否为 HEVC 编码的 HEIC（iPhone 相册原图格式），与文件名无关。 */
export function isHeic(buffer: Buffer): boolean {
  if (buffer.length < 12 || buffer.toString('latin1', 4, 8) !== 'ftyp') return false;
  const boxEnd = Math.min(buffer.readUInt32BE(0), buffer.length);
  // ftyp: size(4) type(4) major_brand(4) minor_version(4) compatible_brands(4*n)
  for (let offset = 8; offset + 4 <= boxEnd; offset += 4) {
    if (offset === 12) continue;
    if (HEVC_BRANDS.has(buffer.toString('latin1', offset, offset + 4))) return true;
  }
  return false;
}

const ICC_SIGNATURE = Buffer.from('ICC_PROFILE\0', 'latin1');
const ICC_MAX_CHUNK = 0xffff - 2 - ICC_SIGNATURE.length - 2;

/**
 * 把 ICC 配置文件以 APP2 段写入 JPEG（超长时按规范分片），插在 SOI/APP0 之后。
 * sharp 无法给原始像素「指定」输入色彩空间，只能借由内嵌 ICC 让 libvips 识别。
 */
export function embedIccProfile(jpeg: Buffer, icc: Buffer): Buffer {
  const count = Math.ceil(icc.length / ICC_MAX_CHUNK);
  const segments: Buffer[] = [];
  for (let i = 0; i < count; i++) {
    const chunk = icc.subarray(i * ICC_MAX_CHUNK, (i + 1) * ICC_MAX_CHUNK);
    const header = Buffer.alloc(4);
    header.writeUInt16BE(0xffe2, 0);
    header.writeUInt16BE(2 + ICC_SIGNATURE.length + 2 + chunk.length, 2);
    segments.push(header, ICC_SIGNATURE, Buffer.from([i + 1, count]), chunk);
  }

  let insertAt = 2; // SOI 之后
  if (jpeg[2] === 0xff && jpeg[3] === 0xe0) {
    insertAt = 4 + jpeg.readUInt16BE(4); // 跳过 JFIF APP0
  }
  return Buffer.concat([jpeg.subarray(0, insertAt), ...segments, jpeg.subarray(insertAt)]);
}

/**
 * 将 HEIC 解码为高质量中间 JPEG（已缩放到 maxDimension 内，保留原 ICC）。
 *
 * sharp 预编译的 libvips 出于专利原因不含 HEVC 解码器，能读 HEIC 元数据却解不出
 * 像素。这里用 heic-decode（libheif 的 WASM 构建，纯 npm 依赖、无需系统包）解码，
 * libheif 会应用 irot/imir，输出像素已是正确朝向。
 *
 * 解码结果是不带色彩信息的 RGBA，而 iPhone 照片是 Display P3：直接当 sRGB 编码会
 * 偏灰。因此把 HEIC 内嵌的 ICC 写回中间 JPEG，后续 sharp 处理时会正确转换到 sRGB。
 */
export async function heicToJpeg(buffer: Buffer, maxDimension: number): Promise<Buffer> {
  const { width, height, data } = await decode({ buffer });
  const pixels = Buffer.from(data.buffer, data.byteOffset, data.byteLength);

  const jpeg = await sharp(pixels, { raw: { width, height, channels: 4 } })
    .resize(maxDimension, maxDimension, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 95 })
    .toBuffer();

  // sharp 能解析 HEIC 容器元数据（只是不能解码像素），借它取出 ICC
  const { icc } = await sharp(buffer).metadata();
  logger.info({ width, height, icc: icc?.length ?? 0 }, 'HEIC 已解码');
  return icc ? embedIccProfile(jpeg, icc) : jpeg;
}
