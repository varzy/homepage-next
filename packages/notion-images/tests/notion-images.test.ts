import { describe, expect, it, beforeEach } from 'vitest';
import type { Client } from '@notionhq/client';

import { NotionImageProcessor } from '../src/notion-images.js';

// 构造 uploader 需要 R2 凭据存在（不会发起网络请求）
beforeEach(() => {
  process.env.R2_ACCOUNT_ID = 'test-account';
  process.env.R2_ACCESS_KEY_ID = 'test-key';
  process.env.R2_SECRET_ACCESS_KEY = 'test-secret';
});

/** 按 block_id 返回对应子块，保证递归有穷。 */
function stubNotion(blocksByParent: Record<string, unknown[]>): Client {
  return {
    blocks: {
      children: {
        list: async ({ block_id }: { block_id: string }) => ({
          results: blocksByParent[block_id] ?? [],
          has_more: false,
          next_cursor: null,
        }),
      },
    },
  } as unknown as Client;
}

describe('NotionImageProcessor.processPageImages', () => {
  it('已托管在 R2 的外链图片直接跳过（幂等，不重复上传）', async () => {
    const processor = new NotionImageProcessor({
      notion: stubNotion({
        'page-1': [
          {
            type: 'image',
            has_children: false,
            image: { type: 'external', external: { url: 'https://cdn.varzy.me/a.jpg' } },
          },
        ],
      }),
      label: 'test',
      compress: true,
    });

    const stats = await processor.processPageImages('page-1');
    expect(stats).toEqual({ total: 1, processed: 0, skipped: 1, errors: 0 });
  });

  it('子块中的图片也会被递归统计', async () => {
    const processor = new NotionImageProcessor({
      notion: stubNotion({
        'page-1': [{ type: 'paragraph', has_children: true, id: 'child-block' }],
        'child-block': [
          {
            type: 'image',
            has_children: false,
            image: { type: 'external', external: { url: 'https://cdn.varzy.me/b.png' } },
          },
        ],
      }),
      label: 'test',
    });

    const stats = await processor.processPageImages('page-1');
    expect(stats).toEqual({ total: 1, processed: 0, skipped: 1, errors: 0 });
  });
});
