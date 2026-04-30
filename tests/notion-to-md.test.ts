import { describe, it, expect } from 'vitest';
import { generateMDXContent } from '../scripts/notion-to-md';
import { PostMetadata } from '../scripts/types';

describe('scripts/notion-to-md.ts', () => {
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
        blog_last_fetched_time: '2024-01-15T12:00:00.000Z',
        page_id: 'page-123',
        icon: '📝',
      };

      const content = 'This is the post content.';
      const result = generateMDXContent(metadata, content);

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
      expect(result).toContain('blog_last_fetched_time: "2024-01-15T12:00:00.000Z"');
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
        blog_last_fetched_time: null,
        page_id: 'page-123',
      };

      const result = generateMDXContent(metadata, '');

      expect(result).toContain('title: "Test \\"quoted\\" Title"');
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
        blog_last_fetched_time: null,
        page_id: 'page-123',
      };

      const result = generateMDXContent(metadata, '');

      expect(result).toContain('summary: "Summary with \\"quotes\\""');
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
        blog_last_fetched_time: null,
        page_id: 'page-123',
      };

      const result = generateMDXContent(metadata, '');

      expect(result).not.toContain('icon:');
    });

    it('blog_last_fetched_time 为 null 时显示为空字符串', () => {
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
        blog_last_fetched_time: null,
        page_id: 'page-123',
      };

      const result = generateMDXContent(metadata, '');

      expect(result).toContain('blog_last_fetched_time: ""');
    });

    it('空 tags 数组生成空数组', () => {
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
        blog_last_fetched_time: null,
        page_id: 'page-123',
      };

      const result = generateMDXContent(metadata, '');

      expect(result).toContain('tags: []');
    });

    it('多行内容正确保留', () => {
      const metadata: PostMetadata = {
        title: 'Title',
        category: 'Tech',
        type: 'Post',
        status: 'Published',
        tags: ['tag1'],
        date: '2024-01-15',
        slug: 'test-slug',
        summary: 'Summary',
        last_edited_time: '',
        blog_last_fetched_time: null,
        page_id: 'page-123',
      };

      const content = 'Line 1\n\nLine 2\n\n## Heading\n\nParagraph';
      const result = generateMDXContent(metadata, content);

      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
      expect(result).toContain('## Heading');
      expect(result).toContain('Paragraph');
    });
  });
});
