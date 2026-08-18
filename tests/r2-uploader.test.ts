import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { composeR2Key, isR2Url, getContentType, r2ImageUploader } from '../scripts/r2-uploader';

describe('scripts/r2-uploader.ts', () => {
  describe('isR2Url', () => {
    beforeEach(() => {
      process.env.R2_PUBLIC_DOMAIN = 'https://img.varzy.me';
    });

    it('匹配自定义域名返回 true', () => {
      expect(isR2Url('https://img.varzy.me/blog_test_123.jpg')).toBe(true);
    });

    it('无协议的域名同样匹配', () => {
      process.env.R2_PUBLIC_DOMAIN = 'img.varzy.me';
      expect(isR2Url('https://img.varzy.me/x.jpg')).toBe(true);
    });

    it('其他域名返回 false', () => {
      expect(isR2Url('https://example.com/image.jpg')).toBe(false);
      expect(isR2Url('https://sm.ms/image/abc')).toBe(false);
    });

    it('空字符串返回 false', () => {
      expect(isR2Url('')).toBe(false);
    });

    it('未配置 R2_PUBLIC_DOMAIN 时返回 false', () => {
      delete process.env.R2_PUBLIC_DOMAIN;
      expect(isR2Url('https://img.varzy.me/x.jpg')).toBe(false);
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

  describe('R2ImageUploader.isHostedUrl（过渡期）', () => {
    beforeEach(() => {
      process.env.R2_PUBLIC_DOMAIN = 'https://img.varzy.me';
      process.env.R2_ACCOUNT_ID = 'dummy-account';
      process.env.R2_ACCESS_KEY_ID = 'dummy-key';
      process.env.R2_SECRET_ACCESS_KEY = 'dummy-secret';
      process.env.R2_BUCKET_NAME = 'dummy-bucket';
    });

    afterEach(() => {
      delete process.env.R2_ACCOUNT_ID;
      delete process.env.R2_ACCESS_KEY_ID;
      delete process.env.R2_SECRET_ACCESS_KEY;
      delete process.env.R2_BUCKET_NAME;
    });

    it('R2 链接视为已托管', () => {
      const uploader = r2ImageUploader();
      expect(uploader.isHostedUrl('https://img.varzy.me/blog_x_123.jpg')).toBe(true);
    });

    it('历史 SMMS 链接也视为已托管（避免重复上传）', () => {
      const uploader = r2ImageUploader();
      expect(uploader.isHostedUrl('https://sm.ms/image/abc123')).toBe(true);
      expect(uploader.isHostedUrl('https://cdn.sa.net/images/abc.png')).toBe(true);
    });

    it('其他外部链接视为未托管', () => {
      const uploader = r2ImageUploader();
      expect(uploader.isHostedUrl('https://example.com/image.jpg')).toBe(false);
    });
  });

  describe('composeR2Key', () => {
    afterEach(() => {
      delete process.env.R2_KEY_PREFIX;
    });

    it('默认前缀为 images', () => {
      delete process.env.R2_KEY_PREFIX;
      expect(composeR2Key('a.jpg')).toBe('images/a.jpg');
    });

    it('自定义前缀', () => {
      process.env.R2_KEY_PREFIX = 'assets/img';
      expect(composeR2Key('a.jpg')).toBe('assets/img/a.jpg');
    });

    it('清理前缀首尾斜杠', () => {
      process.env.R2_KEY_PREFIX = '/images/';
      expect(composeR2Key('a.jpg')).toBe('images/a.jpg');
    });

    it('空前缀时直接使用文件名', () => {
      process.env.R2_KEY_PREFIX = '';
      expect(composeR2Key('a.jpg')).toBe('a.jpg');
    });
  });
});
