import { describe, it, expect } from 'vitest';
import { PostMetadata, FetchResult } from '../scripts/types';

describe('scripts/types.ts', () => {
  describe('PostMetadata', () => {
    it('包含所有必要字段', () => {
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

      expect(metadata.title).toBe('Test Post');
      expect(metadata.category).toBe('Tech');
      expect(metadata.type).toBe('Post');
      expect(metadata.status).toBe('Published');
      expect(metadata.tags).toEqual(['tag1', 'tag2']);
      expect(metadata.date).toBe('2024-01-15');
      expect(metadata.slug).toBe('test-slug');
      expect(metadata.summary).toBe('Test summary');
      expect(metadata.last_edited_time).toBe('2024-01-15T10:00:00.000Z');
      expect(metadata.last_fetched_time).toBe('2024-01-15T12:00:00.000Z');
      expect(metadata.page_id).toBe('page-123');
      expect(metadata.icon).toBe('📝');
    });

    it('icon 为可选字段', () => {
      const metadata: PostMetadata = {
        title: 'Test Post',
        category: 'Tech',
        type: 'Post',
        status: 'Published',
        tags: [],
        date: '2024-01-15',
        slug: 'test-slug',
        summary: '',
        last_edited_time: '',
        last_fetched_time: null,
        page_id: 'page-123',
      };

      expect(metadata.icon).toBeUndefined();
    });

    it('last_fetched_time 可以为 null', () => {
      const metadata: PostMetadata = {
        title: 'Test Post',
        category: 'Tech',
        type: 'Post',
        status: 'Published',
        tags: [],
        date: '2024-01-15',
        slug: 'test-slug',
        summary: '',
        last_edited_time: '',
        last_fetched_time: null,
        page_id: 'page-123',
      };

      expect(metadata.last_fetched_time).toBeNull();
    });
  });

  describe('FetchResult', () => {
    it('包含所有统计字段', () => {
      const result: FetchResult = {
        updated: 5,
        skipped: 3,
        errors: 1,
        deleted: 2,
      };

      expect(result.updated).toBe(5);
      expect(result.skipped).toBe(3);
      expect(result.errors).toBe(1);
      expect(result.deleted).toBe(2);
    });

    it('初始值为 0', () => {
      const result: FetchResult = {
        updated: 0,
        skipped: 0,
        errors: 0,
        deleted: 0,
      };

      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
      expect(result.deleted).toBe(0);
    });

    it('字段类型为数字', () => {
      const result: FetchResult = {
        updated: 0,
        skipped: 0,
        errors: 0,
        deleted: 0,
      };

      expect(typeof result.updated).toBe('number');
      expect(typeof result.skipped).toBe('number');
      expect(typeof result.errors).toBe('number');
      expect(typeof result.deleted).toBe('number');
    });
  });
});
