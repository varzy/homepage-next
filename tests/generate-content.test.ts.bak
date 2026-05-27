import { describe, it, expect } from 'vitest';
import { generateKotobaContent } from '../scripts/fetch-kotoba';
import { generatePageContent } from '../scripts/fetch-pages';
import { generateMDXContent } from '../scripts/fetch-posts';
import { PostMetadata, KotobaMetadata, PageMetadata } from '../scripts/types';

describe('generate content functions', () => {
  // ============================================================
  // generateMDXContent (fetch-posts.ts)
  // ============================================================
  describe('generateMDXContent', () => {
    it('生成包含完整 frontmatter 的 MDX', () => {
      const metadata: PostMetadata = {
        title: 'Test Post',
        category: 'Tech',
        type: 'Post',
        status: 'Published',
        tags: ['tag1', 'tag2'],
        date: '2024-01-15',
        slug: 'test-slug',
        summary: 'Test summary',
        last_edited_time: '2024-01-15T10:00:00.000Z',
        last_fetched_time: '2024-01-15T12:00:00.000Z',
        page_id: 'page-123',
        icon: '📝',
      };

      const result = generateMDXContent(metadata, 'This is the post content.');

      expect(result).toContain('---');
      expect(result).toContain('title: "Test Post"');
      expect(result).toContain('category: "Tech"');
      expect(result).toContain('type: "Post"');
      expect(result).toContain('status: "Published"');
      expect(result).toContain('tags: ["tag1", "tag2"]');
      expect(result).toContain('date: "2024-01-15"');
      expect(result).toContain('slug: "test-slug"');
      expect(result).toContain('summary: "Test summary"');
      expect(result).toContain('last_edited_time: "2024-01-15T10:00:00.000Z"');
      expect(result).toContain('last_fetched_time: "2024-01-15T12:00:00.000Z"');
      expect(result).toContain('page_id: "page-123"');
      expect(result).toContain('icon: "📝"');
      expect(result).toContain('This is the post content.');
    });

    it('转义 title 中的双引号', () => {
      const metadata: PostMetadata = {
        title: 'Test "quoted" Title',
        category: 'Tech',
        type: 'Post',
        status: 'Published',
        tags: [],
        date: '2024-01-15',
        slug: 'test-slug',
        summary: 'Summary',
        last_edited_time: '',
        last_fetched_time: null,
        page_id: 'page-123',
      };

      expect(generateMDXContent(metadata, '')).toContain('title: "Test \\"quoted\\" Title"');
    });

    it('转义 summary 中的双引号', () => {
      const metadata: PostMetadata = {
        title: 'Title',
        category: 'Tech',
        type: 'Post',
        status: 'Published',
        tags: [],
        date: '2024-01-15',
        slug: 'test-slug',
        summary: 'Summary with "quotes"',
        last_edited_time: '',
        last_fetched_time: null,
        page_id: 'page-123',
      };

      expect(generateMDXContent(metadata, '')).toContain('summary: "Summary with \\"quotes\\""');
    });

    it('没有 icon 时不包含 icon 字段', () => {
      const metadata: PostMetadata = {
        title: 'Title',
        category: 'Tech',
        type: 'Post',
        status: 'Published',
        tags: [],
        date: '2024-01-15',
        slug: 'test-slug',
        summary: 'Summary',
        last_edited_time: '',
        last_fetched_time: null,
        page_id: 'page-123',
      };

      expect(generateMDXContent(metadata, '')).not.toContain('icon:');
    });

    it('last_fetched_time 为 null 时输出空字符串', () => {
      const metadata: PostMetadata = {
        title: 'Title',
        category: 'Tech',
        type: 'Post',
        status: 'Published',
        tags: [],
        date: '2024-01-15',
        slug: 'test-slug',
        summary: 'Summary',
        last_edited_time: '',
        last_fetched_time: null,
        page_id: 'page-123',
      };

      expect(generateMDXContent(metadata, '')).toContain('last_fetched_time: ""');
    });

    it('空 tags 生成空数组', () => {
      const metadata: PostMetadata = {
        title: 'Title',
        category: 'Tech',
        type: 'Post',
        status: 'Published',
        tags: [],
        date: '2024-01-15',
        slug: 'test-slug',
        summary: 'Summary',
        last_edited_time: '',
        last_fetched_time: null,
        page_id: 'page-123',
      };

      expect(generateMDXContent(metadata, '')).toContain('tags: []');
    });
  });

  // ============================================================
  // generateKotobaContent (fetch-kotoba.ts)
  // ============================================================
  describe('generateKotobaContent', () => {
    it('生成包含完整 frontmatter 的内容', () => {
      const meta: KotobaMetadata = {
        page_id: 'kotoba-123',
        title: '以心伝心',
        status: 'Published',
        tags: ['N2', '四字熟語'],
        title_url: 'https://example.com',
        with_title: true,
        published_time: '2024-05-01',
        last_edited_time: '2024-05-01T10:00:00.000Z',
        last_fetched_time: '2024-05-01T12:00:00.000Z',
      };

      const result = generateKotobaContent(meta, 'Content here.');

      expect(result).toContain('page_id: "kotoba-123"');
      expect(result).toContain('title: "以心伝心"');
      expect(result).toContain('status: "Published"');
      expect(result).toContain('tags: ["N2", "四字熟語"]');
      expect(result).toContain('title_url: "https://example.com"');
      expect(result).toContain('with_title: true');
      expect(result).toContain('published_time: "2024-05-01"');
      expect(result).toContain('last_edited_time: "2024-05-01T10:00:00.000Z"');
      expect(result).toContain('last_fetched_time: "2024-05-01T12:00:00.000Z"');
      expect(result).toContain('Content here.');
    });

    it('转义 title 中的双引号', () => {
      const meta: KotobaMetadata = {
        page_id: 'k1',
        title: 'Test "word"',
        status: 'Published',
        tags: [],
        title_url: '',
        with_title: false,
        published_time: '2024-05-01',
        last_edited_time: '',
        last_fetched_time: null,
      };

      expect(generateKotobaContent(meta, '')).toContain('title: "Test \\"word\\""');
    });

    it('last_fetched_time 为 null 时输出空字符串', () => {
      const meta: KotobaMetadata = {
        page_id: 'k1',
        title: 'Title',
        status: 'Published',
        tags: [],
        title_url: '',
        with_title: false,
        published_time: '2024-05-01',
        last_edited_time: '',
        last_fetched_time: null,
      };

      expect(generateKotobaContent(meta, '')).toContain('last_fetched_time: ""');
    });

    it('with_title 为 false 时正确写入', () => {
      const meta: KotobaMetadata = {
        page_id: 'k1',
        title: 'Title',
        status: 'Published',
        tags: [],
        title_url: '',
        with_title: false,
        published_time: '2024-05-01',
        last_edited_time: '',
        last_fetched_time: null,
      };

      expect(generateKotobaContent(meta, '')).toContain('with_title: false');
    });

    it('空 tags 生成空数组', () => {
      const meta: KotobaMetadata = {
        page_id: 'k1',
        title: 'Title',
        status: 'Published',
        tags: [],
        title_url: '',
        with_title: false,
        published_time: '',
        last_edited_time: '',
        last_fetched_time: null,
      };

      expect(generateKotobaContent(meta, '')).toContain('tags: []');
    });
  });

  // ============================================================
  // generatePageContent (fetch-pages.ts)
  // ============================================================
  describe('generatePageContent', () => {
    it('生成包含完整 frontmatter 的内容', () => {
      const meta: PageMetadata = {
        page_id: 'page-abc',
        title: 'About Me',
        slug: 'about',
        status: 'Published',
        last_edited_time: '2024-03-01T10:00:00.000Z',
        last_fetched_time: '2024-03-01T12:00:00.000Z',
      };

      const result = generatePageContent(meta, 'Page content.');

      expect(result).toContain('page_id: "page-abc"');
      expect(result).toContain('title: "About Me"');
      expect(result).toContain('slug: "about"');
      expect(result).toContain('status: "Published"');
      expect(result).toContain('last_edited_time: "2024-03-01T10:00:00.000Z"');
      expect(result).toContain('last_fetched_time: "2024-03-01T12:00:00.000Z"');
      expect(result).toContain('Page content.');
    });

    it('转义 title 中的双引号', () => {
      const meta: PageMetadata = {
        page_id: 'p1',
        title: 'My "Page"',
        slug: 'my-page',
        status: 'Published',
        last_edited_time: '',
        last_fetched_time: null,
      };

      expect(generatePageContent(meta, '')).toContain('title: "My \\"Page\\""');
    });

    it('last_fetched_time 为 null 时输出空字符串', () => {
      const meta: PageMetadata = {
        page_id: 'p1',
        title: 'Title',
        slug: 'title',
        status: 'Published',
        last_edited_time: '',
        last_fetched_time: null,
      };

      expect(generatePageContent(meta, '')).toContain('last_fetched_time: ""');
    });
  });
});
