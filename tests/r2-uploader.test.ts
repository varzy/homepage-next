import { createHash } from 'node:crypto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  composeNewImageKey,
  extractExtension,
  getContentType,
  is404,
  isR2Url,
  r2ImageUploader,
} from '../scripts/r2-uploader';

describe('scripts/r2-uploader.ts', () => {
  describe('composeNewImageKey', () => {
    const label = 'posts';
    const pageId = '39adc9c0-364a-8080-b388-dcdc44f78d56';
    const buffer = Buffer.from('some-image-bytes');
    const ext = 'webp';

    it('生成 public/{year}/{month}/{label}/{pageId}/{hash}.{ext} 结构', () => {
      const key = composeNewImageKey(label, pageId, buffer, ext);
      expect(key).toMatch(
        new RegExp(`^public/\\d{4}/\\d{2}/${label}/${pageId}/[0-9a-f]{16}\\.webp$`),
      );
    });

    it('同 buffer → 同 key（内容寻址，幂等）', () => {
      expect(composeNewImageKey(label, pageId, buffer, ext)).toBe(
        composeNewImageKey(label, pageId, buffer, ext),
      );
    });

    it('不同 buffer → 不同 key（不折叠）', () => {
      expect(composeNewImageKey(label, pageId, Buffer.from('a'), ext)).not.toBe(
        composeNewImageKey(label, pageId, Buffer.from('b'), ext),
      );
    });

    it('不同 pageId → 不同 key（按页分组，跨页不去重）', () => {
      expect(composeNewImageKey(label, 'page-A', buffer, ext)).not.toBe(
        composeNewImageKey(label, 'page-B', buffer, ext),
      );
    });

    it('不同 label → 不同 key（按库分组）', () => {
      expect(composeNewImageKey('posts', pageId, buffer, ext)).not.toBe(
        composeNewImageKey('taste', pageId, buffer, ext),
      );
    });

    it('保留传入扩展名', () => {
      expect(composeNewImageKey(label, pageId, buffer, 'png')).toMatch(/\.png$/);
      expect(composeNewImageKey(label, pageId, buffer, 'jpg')).toMatch(/\.jpg$/);
    });

    it('hash 为 sha1(buffer) 前 16 位', () => {
      const expected = createHash('sha1').update(buffer).digest('hex').slice(0, 16);
      expect(composeNewImageKey(label, pageId, buffer, ext).endsWith(`/${expected}.${ext}`)).toBe(
        true,
      );
    });
  });

  describe('extractExtension', () => {
    it('从 URL 末段提取小写扩展名', () => {
      expect(extractExtension('https://a.com/x.jpg')).toBe('jpg');
      expect(extractExtension('https://a.com/x.WEBP')).toBe('webp');
      expect(extractExtension('https://a.com/path/to/img.png')).toBe('png');
    });

    it('无扩展名或非法 URL 回退 jpg', () => {
      expect(extractExtension('https://a.com/noext')).toBe('jpg');
      expect(extractExtension('not-a-url')).toBe('jpg');
    });

    it('过长的伪扩展名回退 jpg', () => {
      expect(extractExtension('https://a.com/file.verylongext')).toBe('jpg');
    });
  });

  describe('isR2Url', () => {
    it('R2 自定义域名返回 true', () => {
      expect(isR2Url('https://cdn.varzy.me/blog_test_123.jpg')).toBe(true);
    });

    it('其他域名返回 false', () => {
      expect(isR2Url('https://example.com/image.jpg')).toBe(false);
      expect(isR2Url('https://sm.ms/image/abc')).toBe(false);
    });

    it('仅 host 精确匹配才为 true（路径含域名片段不算）', () => {
      expect(isR2Url('https://evil.com/cdn.varzy.me/x.jpg')).toBe(false);
    });

    it('空字符串 / 非法 URL 返回 false', () => {
      expect(isR2Url('')).toBe(false);
      expect(isR2Url('not-a-url')).toBe(false);
    });
  });

  describe('getContentType', () => {
    it('按扩展名推断', () => {
      expect(getContentType('a.jpg')).toBe('image/jpeg');
      expect(getContentType('a.JPEG')).toBe('image/jpeg');
      expect(getContentType('a.PNG')).toBe('image/png');
      expect(getContentType('a.webp')).toBe('image/webp');
      expect(getContentType('a.gif')).toBe('image/gif');
      expect(getContentType('a.svg')).toBe('image/svg+xml');
      expect(getContentType('a.bmp')).toBe('image/bmp');
      expect(getContentType('a.ico')).toBe('image/x-icon');
    });

    it('未知扩展名回退为 octet-stream', () => {
      expect(getContentType('a.xyz')).toBe('application/octet-stream');
      expect(getContentType('noext')).toBe('application/octet-stream');
    });

    it('优先使用传入的 image content-type', () => {
      expect(getContentType('a.jpg', 'image/png')).toBe('image/png');
    });

    it('传入非 image content-type 时忽略并按扩展名推断', () => {
      expect(getContentType('a.jpg', 'text/html')).toBe('image/jpeg');
    });

    it('传入带参数的 content-type 时取分号前部分', () => {
      expect(getContentType('a.jpg', 'image/png; charset=utf-8')).toBe('image/png');
    });
  });

  describe('is404', () => {
    it('Cloudflare R2 的 NotFound 错误视为 404', () => {
      const err = { name: 'NotFound', $metadata: { httpStatusCode: 404 } };
      expect(is404(err)).toBe(true);
    });

    it('AWS S3 的 NoSuchKey 错误视为 404', () => {
      const err = { name: 'NoSuchKey', $metadata: { httpStatusCode: 404 } };
      expect(is404(err)).toBe(true);
    });

    it('仅 httpStatusCode 为 404 即视为 404（忽略 name）', () => {
      const err = { name: 'SomethingElse', $metadata: { httpStatusCode: 404 } };
      expect(is404(err)).toBe(true);
    });

    it('非 404 状态码不视为 404', () => {
      expect(is404({ name: 'NoSuchKey', $metadata: { httpStatusCode: 200 } })).toBe(true);
      expect(is404({ name: 'AccessDenied', $metadata: { httpStatusCode: 403 } })).toBe(false);
    });

    it('httpStatusCode 缺失且 name 不匹配时返回 false', () => {
      expect(is404({ name: 'AccessDenied', $metadata: {} })).toBe(false);
    });

    it('非对象 / null / undefined 返回 false', () => {
      expect(is404(null)).toBe(false);
      expect(is404(undefined)).toBe(false);
      expect(is404('string')).toBe(false);
    });
  });

  describe('R2ImageUploader', () => {
    beforeEach(() => {
      delete process.env.R2_ACCOUNT_ID;
      delete process.env.R2_ACCESS_KEY_ID;
      delete process.env.R2_SECRET_ACCESS_KEY;
    });

    it('缺少必需 env 时构造抛错', () => {
      expect(() => r2ImageUploader()).toThrow(/not fully configured/);
    });
  });
});
