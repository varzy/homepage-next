import { describe, it, expect } from 'vitest';
import { generateFileName } from '../scripts/image-uploader';

describe('scripts/image-uploader.ts', () => {
  describe('generateFileName', () => {
    it('生成文件名包含时间戳和随机字符串', () => {
      const url = 'https://example.com/images/photo.jpg';
      const fileName = generateFileName(url);

      expect(fileName).toMatch(/^_\d+_[a-z0-9]+\.jpg$/);
    });

    it('带 prefix 参数', () => {
      const url = 'https://example.com/images/photo.png';
      const fileName = generateFileName(url, 'blog');

      expect(fileName).toMatch(/^blog_\d+_[a-z0-9]+\.png$/);
    });

    it('带 blockId 参数', () => {
      const url = 'https://example.com/images/photo.gif';
      const fileName = generateFileName(url, 'blog', 'block-123');

      expect(fileName).toMatch(/^blog_block-123_\d+\.gif$/);
    });

    it('无扩展名使用默认 jpg', () => {
      const url = 'https://example.com/images/photo';
      const fileName = generateFileName(url);

      expect(fileName).toMatch(/\.jpg$/);
    });

    it('不同 URL 生成不同文件名', () => {
      const fileName1 = generateFileName('https://example.com/images/photo1.jpg');
      const fileName2 = generateFileName('https://example.com/images/photo2.jpg');

      expect(fileName1).not.toBe(fileName2);
    });
  });
});
