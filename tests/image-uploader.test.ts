import { describe, it, expect } from 'vitest';
import {
  extractExtension,
  generateFileName,
  stableFileNameFromUrl,
} from '../scripts/image-uploader';

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

  describe('stableFileNameFromUrl', () => {
    it('同一 URL 恒等映射到同一文件名（稳定性 / 幂等）', () => {
      const url = 'https://i.see.you/2026/07/11/Fv8u/posts_13-sentinels-aegis-rim_39a.jpg';
      expect(stableFileNameFromUrl(url)).toBe(stableFileNameFromUrl(url));
    });

    it('basename 相同但路径段不同的 s.ee 链接生成不同文件名（不折叠）', () => {
      const a = stableFileNameFromUrl(
        'https://i.see.you/2026/07/11/Fv8u/posts_13-sentinels-aegis-rim_39a.jpg',
      );
      const b = stableFileNameFromUrl(
        'https://i.see.you/2026/07/11/pHm0/posts_13-sentinels-aegis-rim_39a.jpg',
      );
      expect(a).not.toBe(b);
    });

    it('不同 URL 生成不同文件名', () => {
      expect(stableFileNameFromUrl('https://a.com/1.jpg')).not.toBe(
        stableFileNameFromUrl('https://a.com/2.jpg'),
      );
    });

    it('不带 prefix/pageId 时退化为纯 <hash>.<ext>', () => {
      expect(stableFileNameFromUrl('https://i.see.you/2026/07/11/Fv8u/x.jpg')).toMatch(
        /^[0-9a-f]{16}\.jpg$/,
      );
    });

    it('带 prefix + pageId 生成三级结构 prefix_pageId_hash.ext', () => {
      const url = 'https://i.see.you/2026/07/11/Fv8u/posts_13-sentinels-aegis-rim_39a.jpg';
      const name = stableFileNameFromUrl(url, 'posts', '39adc9c0-364a-8080-b388-dcdc44f78d56');
      expect(name).toMatch(/^posts_39adc9c0-364a-8080-b388-dcdc44f78d56_[0-9a-f]{16}\.jpg$/);
    });

    it('同链接同页同前缀→同 key（幂等）', () => {
      const url = 'https://i.see.you/2026/07/11/Fv8u/x.jpg';
      expect(stableFileNameFromUrl(url, 'taste', 'p1')).toBe(
        stableFileNameFromUrl(url, 'taste', 'p1'),
      );
    });

    it('同链接不同 pageId→不同 key（按页分组，跨页不去重）', () => {
      const url = 'https://i.see.you/2026/07/11/Fv8u/x.jpg';
      expect(stableFileNameFromUrl(url, 'posts', 'page-A')).not.toBe(
        stableFileNameFromUrl(url, 'posts', 'page-B'),
      );
    });

    it('保留来源扩展名（小写）', () => {
      expect(stableFileNameFromUrl('https://cdn.sa.net/2026/01/20/abc.webp', 'posts', 'p')).toMatch(
        /\.webp$/,
      );
      expect(stableFileNameFromUrl('https://i.see.you/x.png', 'posts', 'p')).toMatch(/\.png$/);
      expect(stableFileNameFromUrl('https://i.see.you/x.JPG', 'posts', 'p')).toMatch(/\.jpg$/);
    });

    it('无扩展名或非法 URL 回退 .jpg 且仍稳定唯一', () => {
      expect(stableFileNameFromUrl('not-a-url')).toBe(stableFileNameFromUrl('not-a-url'));
      expect(stableFileNameFromUrl('not-a-url')).toMatch(/\.jpg$/);
      expect(stableFileNameFromUrl('https://s.ee/noext/abc')).toMatch(/\.jpg$/);
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
});
