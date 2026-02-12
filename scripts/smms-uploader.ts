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
  const smmsUrl = ['cdn.sa.net', 'sm.ms'];
  return smmsUrl.some((u) => url.includes(u));
};

/**
 * 生成合适的文件名
 */
export const generateFileName = (url: string, prefix: string = '', blockId?: string): string => {
  const urlObj = new URL(url);
  const pathParts = urlObj.pathname.split('/');
  const originalName = pathParts[pathParts.length - 1];
  const extension = originalName.includes('.') ? originalName.split('.').pop() : 'jpg';

  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);

  if (blockId) {
    return `${prefix}_${blockId}_${timestamp}.${extension}`;
  }

  return `${prefix}_${timestamp}_${randomStr}.${extension}`;
};
