import { SITE_CONFIG } from '@/site.config';

type SmmsUploadResult = SmmsUploadSuccess | SmmsUploadRepeat;

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
    has: string;
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

export const SMMS_BASEURL = `https://sm.ms/api/v2`;

export const SMMS_TOKEN = SITE_CONFIG.smmsApiToken;

export const smmsUpload = async (file: Blob, fileName: string) => {
  const formData = new FormData();
  formData.append('smfile', file, fileName);
  const res = await fetch(SMMS_BASEURL + '/upload', {
    method: 'post',
    body: formData,
    headers: { Authorization: SMMS_TOKEN },
    cache: 'no-cache',
  });
  return (await res.json()) as SmmsUploadResult;
};

export const smmsUploadExternal = async (url: string, fileName: string) => {
  const resExternal = await fetch(url, { cache: 'no-cache' });
  const fileBlob = await resExternal.blob();
  return await smmsUpload(fileBlob, fileName);
};

export const getSmmsUrl = (smmsUploaded: SmmsUploadResult) => {
  let url;
  if (smmsUploaded.success) {
    url = smmsUploaded.data.url;
  }
  if (smmsUploaded.code === `image_repeated`) {
    url = (smmsUploaded as SmmsUploadRepeat).images;
  }
  return url;
};
