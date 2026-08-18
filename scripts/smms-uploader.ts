import type { ImageUploader, ImageUploadResult } from './image-uploader';

type SmmsUploadResult = SmmsUploadSuccess | SmmsUploadRepeat | SmmsUploadError;

type SmmsUploadSuccess = {
  success: true;
  code: string;
  RequestId: string;
  message: string;
  data: {
    width: number;
    height: number;
    filename: string;
    storename: string;
    size: number;
    path: string;
    hash: string;
    url: string;
    delete: string;
    page: string;
  };
};

type SmmsUploadRepeat = {
  success: false;
  code: 'image_repeated';
  images: string;
};

type SmmsUploadError = {
  success: false;
  code: string;
  message: string;
};

const SMMS_BASEURL = 'https://s.ee/api/v1/file';
const SMMS_URLS = [
  'cdn.sa.net',
  'sm.ms',
  'see.you',
  'fs.to',
  'files.to',
  'fileshare.to',
  'filesharing.to',
  'seecdn.com',
  'seecdn.net',
  'seeusercontent.com',
];

const smmsUpload = async (file: Blob, fileName: string): Promise<SmmsUploadResult> => {
  try {
    const SMMS_TOKEN = process.env.SMMS_API_TOKEN;
    if (!SMMS_TOKEN) {
      throw new Error('SMMS API token is not configured');
    }

    const formData = new FormData();
    formData.append('smfile', file, fileName);

    const res = await fetch(SMMS_BASEURL + '/upload', {
      method: 'POST',
      body: formData,
      headers: { Authorization: SMMS_TOKEN },
      cache: 'no-cache',
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const result = (await res.json()) as SmmsUploadResult;

    // 如果上传失败，记录错误信息
    if (!result.success && result.code !== 'image_repeated') {
      console.warn(`⚠️ SMMS upload failed for ${fileName}:`, result);
    }

    return result;
  } catch (error) {
    console.error(`❌ Error uploading ${fileName} to SMMS:`, error);
    throw error;
  }
};

export const smmsUploadExternal = async (
  url: string,
  fileName: string,
): Promise<SmmsUploadResult> => {
  try {
    console.log(`📥 Downloading image: ${url}`);

    const resExternal = await fetch(url, {
      cache: 'no-cache',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; NotionImageUploader/1.0)',
      },
    });

    if (!resExternal.ok) {
      throw new Error(`Failed to download image: ${resExternal.status} ${resExternal.statusText}`);
    }

    const fileBlob = await resExternal.blob();

    // 检查文件大小（SM.MS 限制 5MB）
    if (fileBlob.size > 5 * 1024 * 1024) {
      throw new Error(`Image too large: ${(fileBlob.size / 1024 / 1024).toFixed(2)}MB (max: 5MB)`);
    }

    console.log(`📤 Uploading to SMMS: ${fileName} (${(fileBlob.size / 1024).toFixed(2)}KB)`);
    return await smmsUpload(fileBlob, fileName);
  } catch (error) {
    console.error(`❌ Error processing external image ${url}:`, error);
    throw error;
  }
};

export const getSmmsUrl = (smmsUploaded: SmmsUploadResult): string | null => {
  if (smmsUploaded.success) {
    return smmsUploaded.data.url;
  }
  if (smmsUploaded.code === 'image_repeated') {
    return (smmsUploaded as SmmsUploadRepeat).images;
  }
  return null;
};

/**
 * 检查 URL 是否已经是 SM.MS 图片链接
 */
export const isSmmsUrl = (url: string): boolean => {
  return SMMS_URLS.some((u) => url.includes(u));
};

/**
 * 将现有 SMMS 上传函数适配为 ImageUploader 接口，作为 r2 之外的回退实现。
 */
class SmmsImageUploader implements ImageUploader {
  async uploadExternal(url: string, fileName: string): Promise<ImageUploadResult> {
    const result = await smmsUploadExternal(url, fileName);
    const finalUrl = getSmmsUrl(result);
    if (!finalUrl) {
      throw new Error('Failed to get SMMS URL from upload result');
    }
    return { url: finalUrl, fileName, size: result.success ? result.data.size : 0 };
  }

  /**
   * SMMS 服务端按内容哈希去重（image_repeated 时返回既有链接），
   * 因此重复上传同一图片会得到稳定的结果 URL，直接复用 uploadExternal 即可。
   */
  async uploadExternalIdempotent(url: string, fileName: string): Promise<ImageUploadResult> {
    return this.uploadExternal(url, fileName);
  }

  isHostedUrl(url: string): boolean {
    return isSmmsUrl(url);
  }
}

/**
 * 创建 SMMS 图片上传器实例。
 */
export const smmsImageUploader = (): ImageUploader => new SmmsImageUploader();
