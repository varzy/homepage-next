import { readFileSync } from "node:fs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { embedIccProfile, heicToJpeg, isHeic } from "../src/heic.js";

// 64x48 的 Display P3 HEIC，由 macOS `sips -s format heic` 生成，与 iPhone 同为 HEVC 编码
const SAMPLE_HEIC = readFileSync(new URL("./fixtures/sample.heic", import.meta.url));

function ftyp(major: string, compatible: string[]): Buffer {
  const body = Buffer.from(major + "\0\0\0\0" + compatible.join(""), "latin1");
  const size = Buffer.alloc(4);
  size.writeUInt32BE(8 + body.length);
  return Buffer.concat([size, Buffer.from("ftyp", "latin1"), body, Buffer.alloc(16)]);
}

describe("isHeic", () => {
  it("按魔数识别 HEVC 编码的 HEIC", () => {
    expect(isHeic(SAMPLE_HEIC)).toBe(true);
    expect(isHeic(ftyp("mif1", ["mif1", "heic"]))).toBe(true);
  });

  it("不把 AVIF、JPEG 等识别为 HEIC", () => {
    expect(isHeic(ftyp("avif", ["mif1", "avif", "miaf"]))).toBe(false);
    expect(isHeic(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(false);
    expect(isHeic(Buffer.from([1, 2, 3]))).toBe(false);
  });
});

describe("embedIccProfile", () => {
  it("写入的 ICC 可被 libvips 读回", async () => {
    const p3 = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#f00" } })
      .withIccProfile("p3")
      .jpeg()
      .toBuffer();
    const { icc } = await sharp(p3).metadata();
    const plain = await sharp({ create: { width: 4, height: 4, channels: 3, background: "#f00" } })
      .jpeg()
      .toBuffer();

    const tagged = embedIccProfile(plain, icc!);

    expect((await sharp(tagged).metadata()).icc?.equals(icc!)).toBe(true);
  });

  it("超长配置文件按 APP2 规范分片", () => {
    const icc = Buffer.alloc(70000, 7);
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);

    const out = embedIccProfile(jpeg, icc);

    const first = out.readUInt16BE(4);
    expect(out.subarray(2, 4)).toEqual(Buffer.from([0xff, 0xe2]));
    expect(out.toString("latin1", 6, 18)).toBe("ICC_PROFILE\0");
    expect([out[18], out[19]]).toEqual([1, 2]);
    const second = 4 + first;
    expect(out.subarray(second, second + 2)).toEqual(Buffer.from([0xff, 0xe2]));
    expect([out[second + 16], out[second + 17]]).toEqual([2, 2]);
    expect(out.length).toBe(jpeg.length + icc.length + 2 * (4 + 12 + 2));
  });
});

describe("heicToJpeg", () => {
  it("把 HEIC 解码为带原 ICC 的 JPEG", async () => {
    const jpeg = await heicToJpeg(SAMPLE_HEIC, 1920);
    const meta = await sharp(jpeg).metadata();

    expect(meta.format).toBe("jpeg");
    expect([meta.width, meta.height]).toEqual([64, 48]);
    expect(meta.icc?.equals((await sharp(SAMPLE_HEIC).metadata()).icc!)).toBe(true);
  });

  it("超过最大尺寸时等比缩放", async () => {
    const meta = await sharp(await heicToJpeg(SAMPLE_HEIC, 32)).metadata();
    expect([meta.width, meta.height]).toEqual([32, 24]);
  });
});
