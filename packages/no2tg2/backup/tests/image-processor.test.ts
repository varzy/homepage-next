import { describe, expect, it, vi } from 'vitest';
import type { BlockObjectResponse, Client } from '@notionhq/client';

import { processPageImages } from '../src/image-processor.js';
import type { SmmsUploadSuccess } from '../src/smms.js';

const FAKE_TOKEN = 'test-token-123';

function makeImageBlock(
  id: string,
  url: string,
  type: 'file' | 'external' = 'file',
): BlockObjectResponse {
  const block = {
    object: 'block' as const,
    id,
    type: 'image' as const,
    has_children: false,
    image: {
      type,
      caption: [],
      [type]: { url },
    },
  };

  if (type === 'file') {
    (block.image as Record<string, unknown>).file = {
      url,
      expiry_time: '2025-01-01T00:00:00.000Z',
    };
  } else {
    (block.image as Record<string, unknown>).external = { url };
  }

  return block as unknown as BlockObjectResponse;
}

function makeParentBlock(id: string): BlockObjectResponse {
  return {
    object: 'block',
    id,
    type: 'column_list',
    has_children: true,
  } as unknown as BlockObjectResponse;
}

function makeParagraphBlock(id: string): BlockObjectResponse {
  return {
    object: 'block',
    id,
    type: 'paragraph',
    has_children: false,
    paragraph: {
      rich_text: [{ type: 'text', text: { content: 'hello' }, plain_text: 'hello' }],
    },
  } as unknown as BlockObjectResponse;
}

function mockSmmsSuccess(url: string): SmmsUploadSuccess {
  return {
    success: true,
    code: 'success',
    RequestId: 'req-1',
    message: 'Upload success',
    data: {
      width: 800,
      height: 600,
      filename: 'test.jpg',
      storename: 'store-test.jpg',
      size: 12345,
      path: '/path',
      hash: 'abc',
      url,
      delete: 'https://sm.ms/delete/abc',
      page: 'https://sm.ms/image/abc',
    },
  };
}

function createDeps() {
  const blocksList = vi.fn();
  const blocksUpdate = vi.fn();
  const mockUpload = vi.fn();
  const mockCompress = vi.fn(async (buffer: Buffer) => buffer);
  const mockFetch = vi.fn();

  const notionMock = {
    blocks: {
      children: {
        list: blocksList,
      },
      update: blocksUpdate,
    },
  } as unknown as Client;

  return { notionMock, blocksList, blocksUpdate, mockUpload, mockCompress, mockFetch };
}

describe('processPageImages', () => {
  it('页面无图片时返回 total:0', async () => {
    const { notionMock, blocksList, blocksUpdate, mockUpload } = createDeps();

    blocksList.mockResolvedValueOnce({
      results: [makeParagraphBlock('p1')],
      has_more: false,
    });

    const stats = await processPageImages('page-1', FAKE_TOKEN, {
      notionClient: notionMock,
      uploadToSmms: mockUpload,
    });

    expect(stats).toEqual({ total: 0, processed: 0, skipped: 0, errors: 0 });
    expect(blocksUpdate).not.toHaveBeenCalled();
  });

  it('处理 Notion 托管的图片：下载→压缩→上传→更新 block', async () => {
    const { notionMock, blocksList, blocksUpdate, mockUpload, mockCompress, mockFetch } =
      createDeps();

    blocksList.mockResolvedValueOnce({
      results: [makeImageBlock('img-1', 'https://notion-hosted/image.png', 'file')],
      has_more: false,
    });
    blocksUpdate.mockResolvedValueOnce({ id: 'img-1' });
    mockUpload.mockResolvedValueOnce(mockSmmsSuccess('https://cdn.sa.net/uploaded.png'));
    mockFetch.mockResolvedValueOnce(
      new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), { status: 200 }),
    );

    const stats = await processPageImages('page-1', FAKE_TOKEN, {
      notionClient: notionMock,
      uploadToSmms: mockUpload,
      compressImage: mockCompress,
      fetch: mockFetch,
    });

    expect(stats).toEqual({ total: 1, processed: 1, skipped: 0, errors: 0 });
    expect(mockCompress).toHaveBeenCalledTimes(1);
    expect(mockUpload).toHaveBeenCalledTimes(1);
    expect(blocksUpdate).toHaveBeenCalledWith({
      block_id: 'img-1',
      image: { external: { url: 'https://cdn.sa.net/uploaded.png' } },
    });
  });

  it('跳过已经是 SM.MS 地址的外部图片', async () => {
    const { notionMock, blocksList, blocksUpdate, mockUpload } = createDeps();

    blocksList.mockResolvedValueOnce({
      results: [
        makeImageBlock('img-1', 'https://sm.ms/image/already-uploaded.jpg', 'external'),
      ],
      has_more: false,
    });

    const stats = await processPageImages('page-1', FAKE_TOKEN, {
      notionClient: notionMock,
      uploadToSmms: mockUpload,
    });

    expect(stats).toEqual({ total: 1, processed: 0, skipped: 1, errors: 0 });
    expect(blocksUpdate).not.toHaveBeenCalled();
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('处理非 SM.MS 的外部图片', async () => {
    const { notionMock, blocksList, blocksUpdate, mockUpload, mockFetch } = createDeps();

    blocksList.mockResolvedValueOnce({
      results: [makeImageBlock('img-1', 'https://example.com/external.jpg', 'external')],
      has_more: false,
    });
    mockFetch.mockResolvedValueOnce(
      new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), { status: 200 }),
    );
    mockUpload.mockResolvedValueOnce(
      mockSmmsSuccess('https://cdn.sa.net/external-uploaded.jpg'),
    );

    const stats = await processPageImages('page-1', FAKE_TOKEN, {
      notionClient: notionMock,
      uploadToSmms: mockUpload,
      fetch: mockFetch,
    });

    expect(stats).toEqual({ total: 1, processed: 1, skipped: 0, errors: 0 });
    expect(blocksUpdate).toHaveBeenCalledWith({
      block_id: 'img-1',
      image: { external: { url: 'https://cdn.sa.net/external-uploaded.jpg' } },
    });
  });

  it('处理图片上传失败时记录错误但不中断流程', async () => {
    const { notionMock, blocksList, blocksUpdate, mockUpload, mockCompress, mockFetch } =
      createDeps();

    blocksList.mockResolvedValueOnce({
      results: [
        makeImageBlock('img-1', 'https://notion-hosted/1.png', 'file'),
        makeImageBlock('img-2', 'https://notion-hosted/2.png', 'file'),
      ],
      has_more: false,
    });
    mockFetch.mockResolvedValue(
      new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), { status: 200 }),
    );
    mockUpload
      .mockRejectedValueOnce(new Error('Upload failed'))
      .mockResolvedValueOnce(mockSmmsSuccess('https://cdn.sa.net/2.png'));

    const stats = await processPageImages('page-1', FAKE_TOKEN, {
      notionClient: notionMock,
      uploadToSmms: mockUpload,
      compressImage: mockCompress,
      fetch: mockFetch,
    });

    expect(stats).toEqual({ total: 2, processed: 1, skipped: 0, errors: 1 });
    expect(blocksUpdate).toHaveBeenCalledTimes(1);
    expect(blocksUpdate).toHaveBeenCalledWith({
      block_id: 'img-2',
      image: { external: { url: 'https://cdn.sa.net/2.png' } },
    });
  });

  it('处理分页：遍历所有结果页', async () => {
    const { notionMock, blocksList, mockUpload, mockCompress, mockFetch } = createDeps();

    blocksList.mockResolvedValueOnce({
      results: [makeImageBlock('img-1', 'https://notion-hosted/1.png', 'file')],
      has_more: true,
      next_cursor: 'cursor-2',
    });
    blocksList.mockResolvedValueOnce({
      results: [makeImageBlock('img-2', 'https://notion-hosted/2.png', 'file')],
      has_more: false,
    });

    mockFetch.mockResolvedValue(
      new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), { status: 200 }),
    );
    mockUpload
      .mockResolvedValueOnce(mockSmmsSuccess('https://cdn.sa.net/1.png'))
      .mockResolvedValueOnce(mockSmmsSuccess('https://cdn.sa.net/2.png'));

    const stats = await processPageImages('page-1', FAKE_TOKEN, {
      notionClient: notionMock,
      uploadToSmms: mockUpload,
      compressImage: mockCompress,
      fetch: mockFetch,
    });

    expect(stats).toEqual({ total: 2, processed: 2, skipped: 0, errors: 0 });
    expect(blocksList).toHaveBeenCalledTimes(2);
    expect(blocksList.mock.calls[1][0]).toMatchObject({
      block_id: 'page-1',
      start_cursor: 'cursor-2',
    });
  });

  it('递归处理子 block 中的图片', async () => {
    const { notionMock, blocksList, mockUpload, mockFetch } = createDeps();

    // First level: paragraph + parent with children
    blocksList.mockResolvedValueOnce({
      results: [makeParagraphBlock('p1'), makeParentBlock('parent-1')],
      has_more: false,
    });
    // Children of parent-1
    blocksList.mockResolvedValueOnce({
      results: [makeImageBlock('img-1', 'https://notion-hosted/nested.png', 'file')],
      has_more: false,
    });

    mockFetch.mockResolvedValue(
      new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), { status: 200 }),
    );
    mockUpload.mockResolvedValueOnce(mockSmmsSuccess('https://cdn.sa.net/nested.png'));

    const stats = await processPageImages('page-1', FAKE_TOKEN, {
      notionClient: notionMock,
      uploadToSmms: mockUpload,
      fetch: mockFetch,
    });

    expect(stats).toEqual({ total: 1, processed: 1, skipped: 0, errors: 0 });
    expect(blocksList).toHaveBeenCalledTimes(2);
    expect(blocksList.mock.calls[1][0]).toMatchObject({ block_id: 'parent-1' });
  });

  it('下载图片失败时记录错误并继续', async () => {
    const { notionMock, blocksList, blocksUpdate, mockUpload, mockFetch } = createDeps();

    blocksList.mockResolvedValueOnce({
      results: [makeImageBlock('img-1', 'https://notion-hosted/bad.png', 'file')],
      has_more: false,
    });
    mockFetch.mockResolvedValueOnce(new Response('Not Found', { status: 404 }));

    const stats = await processPageImages('page-1', FAKE_TOKEN, {
      notionClient: notionMock,
      uploadToSmms: mockUpload,
      fetch: mockFetch,
    });

    expect(stats).toEqual({ total: 1, processed: 0, skipped: 0, errors: 1 });
    expect(mockUpload).not.toHaveBeenCalled();
    expect(blocksUpdate).not.toHaveBeenCalled();
  });

  it('sm.ms 返回 image_repeated 时也视为成功', async () => {
    const { notionMock, blocksList, blocksUpdate, mockUpload, mockFetch } = createDeps();

    blocksList.mockResolvedValueOnce({
      results: [makeImageBlock('img-1', 'https://notion-hosted/duplicate.png', 'file')],
      has_more: false,
    });
    mockFetch.mockResolvedValueOnce(
      new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), { status: 200 }),
    );
    mockUpload.mockResolvedValueOnce({
      success: false,
      code: 'image_repeated',
      images: 'https://cdn.sa.net/existing.png',
    });

    const stats = await processPageImages('page-1', FAKE_TOKEN, {
      notionClient: notionMock,
      uploadToSmms: mockUpload,
      fetch: mockFetch,
    });

    expect(stats).toEqual({ total: 1, processed: 1, skipped: 0, errors: 0 });
    expect(blocksUpdate).toHaveBeenCalledWith({
      block_id: 'img-1',
      image: { external: { url: 'https://cdn.sa.net/existing.png' } },
    });
  });
});
