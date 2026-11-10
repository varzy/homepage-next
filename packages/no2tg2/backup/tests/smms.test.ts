import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { generateFileName, getSmmsUrl, isSmmsUrl, uploadImageFromUrl, uploadToSmms } from '../src/smms.js';

const FAKE_TOKEN = 'test-token-123';

describe('generateFileName', () => {
  it('从 URL 中提取扩展名并使用 blockId 生成文件名', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1717200000000);

    const name = generateFileName('https://example.com/images/photo.png', 'abc12345');

    expect(name).toBe('no2tg2_abc12345_1717200000000.png');
  });

  it('URL 无扩展名时默认使用 jpg', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1717200000000);

    const name = generateFileName('https://example.com/images/photo', 'block001');

    expect(name).toBe('no2tg2_block001_1717200000000.jpg');
  });

  it('使用 .jpeg 扩展名', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1717200000000);

    const name = generateFileName('https://example.com/photo.jpeg', 'xyz');

    expect(name).toBe('no2tg2_xyz_1717200000000.jpeg');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});

describe('isSmmsUrl', () => {
  it('sm.ms 域名的 URL 返回 true', () => {
    expect(isSmmsUrl('https://sm.ms/image/abc123')).toBe(true);
  });

  it('cdn.sa.net 域名的 URL 返回 true', () => {
    expect(isSmmsUrl('https://cdn.sa.net/2024/01/01/abc.jpg')).toBe(true);
  });

  it('i.see.you 域名的 URL 返回 true', () => {
    expect(isSmmsUrl('https://i.see.you/abc.png')).toBe(true);
  });

  it('其他域名的 URL 返回 false', () => {
    expect(isSmmsUrl('https://example.com/image.jpg')).toBe(false);
  });

  it('Notion 托管的图片 URL 返回 false', () => {
    expect(isSmmsUrl('https://prod-files-secure.s3.us-west-2.amazonaws.com/abc/image.png')).toBe(false);
  });

  it('URL 中包含 sm.ms 字符串但不是域名也返回 true', () => {
    expect(isSmmsUrl('https://not-sm.ms/photo.jpg')).toBe(true);
  });
});

describe('getSmmsUrl', () => {
  it('上传成功时返回 data.url', () => {
    const result = getSmmsUrl({
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
        path: '/path/to/image',
        hash: 'abc123',
        url: 'https://cdn.sa.net/2024/01/01/abc.jpg',
        delete: 'https://sm.ms/delete/abc',
        page: 'https://sm.ms/image/abc',
      },
    });

    expect(result).toBe('https://cdn.sa.net/2024/01/01/abc.jpg');
  });

  it('图片重复时返回已有的 images URL', () => {
    const result = getSmmsUrl({
      success: false,
      code: 'image_repeated',
      images: 'https://cdn.sa.net/2024/01/01/existing.jpg',
    });

    expect(result).toBe('https://cdn.sa.net/2024/01/01/existing.jpg');
  });

  it('上传失败时返回 null', () => {
    const result = getSmmsUrl({
      success: false,
      code: 'error_code',
      message: 'Upload failed',
    });

    expect(result).toBeNull();
  });
});

describe('uploadToSmms', () => {
  const imageBuffer = Buffer.from('fake-image-data');

  it('成功上传并将 Buffer 作为 FormData 发送到 SM.MS API', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
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
            url: 'https://cdn.sa.net/test.jpg',
            delete: 'https://sm.ms/delete/abc',
            page: 'https://sm.ms/image/abc',
          },
        }),
        { status: 200 },
      ),
    );

    const result = await uploadToSmms(imageBuffer, 'test.jpg', FAKE_TOKEN, mockFetch);

    expect(result.success).toBe(true);
    expect(result.data.url).toBe('https://cdn.sa.net/test.jpg');

    // 验证 fetch 调用参数
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe('https://s.ee/api/v1/file/upload');
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toBe(FAKE_TOKEN);

    // 验证 FormData 包含文件
    const formData = init.body as FormData;
    const file = formData.get('smfile') as File;
    expect(file).toBeTruthy();
    expect(file.name).toBe('test.jpg');
  });

  it('上传失败时返回错误结果', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          code: 'bad_request',
          message: 'Invalid file',
        }),
        { status: 400 },
      ),
    );

    const result = await uploadToSmms(imageBuffer, 'test.png', FAKE_TOKEN, mockFetch);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('bad_request');
      expect(result.message).toBe('Invalid file');
    }
  });

  it('HTTP 请求出错时抛出异常', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(uploadToSmms(imageBuffer, 'test.jpg', FAKE_TOKEN, mockFetch)).rejects.toThrow(
      'Network error',
    );
  });
});

describe('uploadImageFromUrl', () => {
  it('下载外部图片后上传到 SM.MS', async () => {
    const imageData = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]); // PNG header
    const mockFetch = vi
      .fn()
      // 第一次调用：下载图片
      .mockResolvedValueOnce(new Response(imageData, { status: 200 }))
      // 第二次调用：上传到 SM.MS
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            success: true,
            code: 'success',
            RequestId: 'req-2',
            message: 'Upload success',
            data: {
              width: 400,
              height: 300,
              filename: 'remote.png',
              storename: 'store-remote.png',
              size: 5000,
              path: '/path',
              hash: 'def456',
              url: 'https://cdn.sa.net/uploaded.png',
              delete: 'https://sm.ms/delete/def',
              page: 'https://sm.ms/image/def',
            },
          }),
          { status: 200 },
        ),
      );

    const result = await uploadImageFromUrl(
      'https://example.com/remote-image.png',
      'remote.png',
      FAKE_TOKEN,
      mockFetch,
    );

    expect(result.success).toBe(true);
    expect(result.data.url).toBe('https://cdn.sa.net/uploaded.png');
    expect(mockFetch).toHaveBeenCalledTimes(2);

    // 验证第一次调用是下载图片
    const [downloadUrl] = mockFetch.mock.calls[0];
    expect(downloadUrl).toBe('https://example.com/remote-image.png');

    // 验证第二次调用是上传
    const [, uploadInit] = mockFetch.mock.calls[1];
    expect(uploadInit.method).toBe('POST');
  });

  it('下载失败时抛出错误', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('Not Found', { status: 404 }));

    await expect(
      uploadImageFromUrl('https://example.com/missing.jpg', 'missing.jpg', FAKE_TOKEN, mockFetch),
    ).rejects.toThrow('下载图片失败');
  });

  it('图片超过 5MB 时抛出错误', async () => {
    // 创建一个超过 5MB 的假图片数据（使用简单的 Uint8Array）
    const largeData = new Uint8Array(6 * 1024 * 1024);
    const mockFetch = vi.fn().mockResolvedValue(new Response(largeData, { status: 200 }));

    await expect(
      uploadImageFromUrl('https://example.com/large.jpg', 'large.jpg', FAKE_TOKEN, mockFetch),
    ).rejects.toThrow('图片过大');
  });
});
