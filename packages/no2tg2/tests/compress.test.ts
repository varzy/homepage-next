import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { compressImage, detectImageFormat, stripJpegSecondaryImages } from "../src/compress.js";

const SAMPLE_HEIC = readFileSync(new URL("./fixtures/sample.heic", import.meta.url));

function solid(width: number, height: number) {
  return sharp({ create: { width, height, channels: 3, background: "#3366cc" } });
}

describe("detectImageFormat", () => {
  it("按魔数识别常见格式", async () => {
    expect(detectImageFormat(await solid(2, 2).jpeg().toBuffer())).toBe("jpeg");
    expect(detectImageFormat(await solid(2, 2).png().toBuffer())).toBe("png");
    expect(detectImageFormat(await solid(2, 2).webp().toBuffer())).toBe("webp");
    expect(detectImageFormat(await solid(2, 2).gif().toBuffer())).toBe("gif");
    expect(detectImageFormat(SAMPLE_HEIC)).toBe("heic");
    expect(detectImageFormat(Buffer.from("hello world!"))).toBe("unknown");
  });
});

describe("compressImage", () => {
  it("HEIC 转为 JPEG，并把 Display P3 正确转换到 sRGB", async () => {
    const out = await compressImage(SAMPLE_HEIC, "sample.heic");

    expect(out).toMatchObject({ format: "jpeg", ext: "jpg", contentType: "image/jpeg" });
    const meta = await sharp(out.buffer).metadata();
    expect([meta.format, meta.width, meta.height]).toEqual(["jpeg", 64, 48]);

    // 夹具左上象限是 sRGB(230,40,90) 转入 P3 后的 (210,61,91)；
    // 若把 P3 像素误当 sRGB 会得到偏灰的 (210,61,91)，正确转换应回到约 (230,40,90)
    const { data } = await sharp(out.buffer).extract({ left: 8, top: 8, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
    expect(data[0]).toBeGreaterThan(222);
    expect(data[1]).toBeLessThan(50);
  });

  it("超大 JPEG 缩放到 1920 以内", async () => {
    const out = await compressImage(await solid(4000, 3000).jpeg().toBuffer(), "big.jpg");
    const meta = await sharp(out.buffer).metadata();
    expect([meta.width, meta.height]).toEqual([1920, 1440]);
    expect(out.ext).toBe("jpg");
  });

  it("PNG 保持 PNG，GIF 原样返回", async () => {
    const png = await compressImage(await solid(10, 10).png().toBuffer(), "a.png");
    expect(png).toMatchObject({ format: "png", ext: "png" });

    const gifBuffer = await solid(10, 10).gif().toBuffer();
    const gif = await compressImage(gifBuffer, "a.gif");
    expect(gif.buffer).toBe(gifBuffer);
    expect(gif.ext).toBe("gif");
  });

  it("损坏的 JPEG 回退原图", async () => {
    const broken = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(32)]);
    const out = await compressImage(broken, "broken.jpg");
    expect(out.buffer).toBe(broken);
    expect(out.format).toBe("jpeg");
  });

  it("无法解码的 HEIC 或未知格式直接抛错，不回退原图", async () => {
    const brokenHeic = Buffer.concat([SAMPLE_HEIC.subarray(0, 40), Buffer.alloc(64)]);
    await expect(compressImage(brokenHeic, "broken.heic")).rejects.toThrow("格式 heic");
    await expect(compressImage(Buffer.from("not an image"), "x")).rejects.toThrow("格式 unknown");
  });
});

const SOI = Buffer.from([0xff, 0xd8]);
const EOI = Buffer.from([0xff, 0xd9]);

/** 构造一个带长度字段的 JPEG 段（APPn/COM/DQT/SOFn 等）。 */
function segment(marker: number, body: Buffer): Buffer {
  const len = Buffer.alloc(2);
  len.writeUInt16BE(body.length + 2, 0);
  return Buffer.concat([Buffer.from([0xff, marker]), len, body]);
}

/** 构造 SOS：段头 + 若干熵编码字节（含 FF00 填充与 RSTn）+ EOI。 */
function sosWithEntropy(): Buffer {
  const header = segment(0xda, Buffer.from([0x00, 0x01, 0x02])); // SOS 段头
  const entropy = Buffer.from([
    0x12, 0x34, 0xff, 0x00, // FF00 填充字节，属熵编码数据
    0x56, 0xff, 0xd0, // RST0，仍属熵编码流
    0x78,
  ]);
  return Buffer.concat([header, entropy, EOI]);
}

/** 主图 = SOI + APP1(含 Exif 缩略图片段，整体按长度跳过) + 摘要段 + SOS+熵+EOI。 */
function primaryImage(): Buffer {
  const app1 = segment(0xe1, Buffer.from([0x45, 0x78, 0x69, 0x66, 0xaa, 0xbb])); // 含 "Exif"
  const sof = segment(0xc0, Buffer.from([0x08, 0x01, 0x01]));
  return Buffer.concat([SOI, app1, sof, sosWithEntropy()]);
}

describe("stripJpegSecondaryImages", () => {
  it("剥离主图 EOI 之后的次级图片（Ultra HDR gain map）", () => {
    const primary = primaryImage();
    const gainMap = Buffer.concat([SOI, segment(0xe1, Buffer.from([0x99, 0x88]), EOI)]);
    const multi = Buffer.concat([primary, gainMap]);

    const stripped = stripJpegSecondaryImages(multi);

    expect(stripped.length).toBe(primary.length);
    expect(stripped.equals(primary)).toBe(true);
  });

  it("单图 JPEG（EOI 即末尾）原样返回", () => {
    const primary = primaryImage();
    expect(stripJpegSecondaryImages(primary).equals(primary)).toBe(true);
  });

  it("非 JPEG（如 PNG）原样返回", () => {
    const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
    expect(stripJpegSecondaryImages(png).equals(png)).toBe(true);
  });

  it("过短或非法缓冲原样返回", () => {
    const tiny = Buffer.from([0x01, 0x02]);
    expect(stripJpegSecondaryImages(tiny).equals(tiny)).toBe(true);

    const noEoi = Buffer.concat([SOI, segment(0xe1, Buffer.from([0x1, 0x2]))]);
    expect(stripJpegSecondaryImages(noEoi).equals(noEoi)).toBe(true);
  });
});