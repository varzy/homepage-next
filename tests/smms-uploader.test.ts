import { describe, it, expect } from 'vitest';
import { isSmmsUrl, getSmmsUrl } from '../scripts/smms-uploader';

describe('scripts/smms-uploader.ts', () => {
  describe('isSmmsUrl', () => {
    it('smms.io 域名返回 true', () => {
      expect(isSmmsUrl('https://sm.ms/image/abc123')).toBe(true);
    });

    it('cdn.sa.net 域名返回 true', () => {
      expect(isSmmsUrl('https://cdn.sa.net/images/abc123')).toBe(true);
    });

    it('i.see.you 域名返回 true', () => {
      expect(isSmmsUrl('https://i.see.you/images/abc123')).toBe(true);
    });

    it('其他域名返回 false', () => {
      expect(isSmmsUrl('https://example.com/image/abc123')).toBe(false);
      expect(isSmmsUrl('https://imgur.com/image/abc123')).toBe(false);
      expect(isSmmsUrl('https://cloudinary.com/image/abc123')).toBe(false);
    });

    it('空字符串返回 false', () => {
      expect(isSmmsUrl('')).toBe(false);
    });

    it('仅检查是否包含特定域名字符串', () => {
      // 实际实现使用 includes 检查 URL 中是否包含特定字符串
      expect(isSmmsUrl('https://sm.ms/image/abc123')).toBe(true);
      expect(isSmmsUrl('https://cdn.sa.net/image/abc123')).toBe(true);
      expect(isSmmsUrl('https://i.see.you/image/abc123')).toBe(true);
    });
  });

  describe('getSmmsUrl', () => {
    it('成功上传返回 URL', () => {
      const result = {
        success: true,
        code: 'success',
        RequestId: 'req-123',
        message: 'uploaded',
        data: {
          width: 100,
          height: 100,
          filename: 'test.jpg',
          storename: 'test.jpg',
          size: 1024,
          path: '/images/test.jpg',
          hash: 'abc123',
          url: 'https://sm.ms/image/abc123',
          delete: 'https://sm.ms/delete/abc123',
          page: 'https://sm.ms/image/abc123',
        },
      };

      expect(getSmmsUrl(result)).toBe('https://sm.ms/image/abc123');
    });

    it('重复图片返回 images 字段', () => {
      const result = {
        success: false,
        code: 'image_repeated',
        images: 'https://sm.ms/image/existing123',
      } as const;

      expect(getSmmsUrl(result)).toBe('https://sm.ms/image/existing123');
    });

    it('上传失败返回 null', () => {
      const result = {
        success: false,
        code: 'some_error',
        message: 'Upload failed',
      } as const;

      expect(getSmmsUrl(result)).toBeNull();
    });
  });
});
