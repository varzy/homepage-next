import type { Client, PageObjectResponse } from '@notionhq/client';
import { describe, expect, it, beforeEach, afterEach, vi } from 'vitest';
import { NotionImageProcessor } from '../src/notion-images.js';
import { R2ImageUploader } from '../src/r2-uploader.js';

// 构造 uploader 需要 R2 凭据存在（不会发起网络请求）
beforeEach(() => {
  process.env.R2_ACCOUNT_ID = 'test-account';
  process.env.R2_ACCESS_KEY_ID = 'test-key';
  process.env.R2_SECRET_ACCESS_KEY = 'test-secret';
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
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
  it('跳过已托管在自定义 R2 域名的图片块', async () => {
    const processor = new NotionImageProcessor({
      notion: stubNotion({
        'page-1': [
          {
            type: 'image',
            has_children: false,
            image: { type: 'external', external: { url: 'https://images.example.com/a.jpg' } },
          },
        ],
      }),
      label: 'test',
      uploader: { publicDomain: 'https://images.example.com' },
    });

    const fetchImage = vi.fn();
    vi.stubGlobal('fetch', fetchImage);
    const stats = await processor.processPageImages('page-1');
    expect(stats).toEqual({ total: 1, processed: 0, skipped: 1, errors: 0 });
    expect(fetchImage).not.toHaveBeenCalled();
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

describe('NotionImageProcessor.processPageFileProperties', () => {
  it.each([false, true])('保留原附件并返回 Notion 的页面（部分响应：%s）', async (partial) => {
    const hosted = {
      type: 'external',
      name: 'already.gif',
      external: { url: 'https://images.example.com/already.gif' },
    } as const;
    const unavailable = {
      type: 'file',
      name: 'unavailable.gif',
      file: {
        url: 'https://notion.example.com/unavailable.gif',
        expiry_time: '2026-11-11T12:00:00Z',
      },
    } as const;
    const source = {
      type: 'external',
      name: 'source.gif',
      external: { url: 'https://example.com/source.gif' },
    } as const;
    const replacement = { ...source, external: { url: 'https://images.example.com/uploaded.gif' } };
    const user = { id: 'user-1', object: 'user' } as const;
    const page: PageObjectResponse = {
      id: 'page-1',
      object: 'page',
      url: 'https://notion.example.com/page-1',
      public_url: null,
      created_time: '2026-11-11T10:00:00Z',
      last_edited_time: '2026-11-11T10:00:00Z',
      created_by: user,
      last_edited_by: user,
      in_trash: false,
      archived: false,
      is_archived: false,
      is_locked: false,
      parent: { type: 'data_source_id', data_source_id: 'source-1', database_id: 'database-1' },
      icon: null,
      cover: null,
      properties: {
        cover: { id: 'cover-id', type: 'files', files: [hosted, unavailable, source] },
      },
    };
    const files = [hosted, unavailable, replacement];
    const updatedPage: PageObjectResponse = {
      ...page,
      properties: { cover: { id: 'cover-id', type: 'files', files } },
    };
    const update = vi
      .fn()
      .mockResolvedValue(partial ? { id: page.id, object: 'page' } : updatedPage);
    const retrieve = vi.fn().mockResolvedValue(updatedPage);
    const processor = new NotionImageProcessor({
      notion: { pages: { update, retrieve } } as unknown as Client,
      label: 'test',
      uploader: { publicDomain: 'https://images.example.com' },
    });
    const gif = Buffer.from('R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'base64');
    const fetchImage = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 503 }))
      .mockResolvedValueOnce(new Response(new Uint8Array(gif)));
    vi.stubGlobal('fetch', fetchImage);
    vi.spyOn(R2ImageUploader.prototype, 'uploadBuffer').mockResolvedValue({
      fileName: 'uploaded.gif',
      url: replacement.external.url,
    });

    expect(await processor.processPageFileProperties(page)).toBe(updatedPage);
    expect(fetchImage.mock.calls.map(([url]) => url)).toEqual([
      unavailable.file.url,
      source.external.url,
    ]);
    expect(update).toHaveBeenCalledWith({ page_id: page.id, properties: { cover: { files } } });
    expect(retrieve).toHaveBeenCalledTimes(partial ? 1 : 0);
  });
});
