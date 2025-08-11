#!/usr/bin/env tsx

import 'dotenv/config';
import { smmsUploadExternal, getSmmsUrl, isSmmsUrl, generateFileName } from '../src/utils/smms';

/**
 * 测试 SM.MS 图片上传功能
 */
async function testImageUpload() {
  console.log('🧪 Testing SM.MS image upload functionality...\n');

  // 检查环境变量
  if (!process.env.SMMS_API_TOKEN) {
    console.error('❌ SMMS_API_TOKEN is not set in environment variables');
    console.log('Please add SMMS_API_TOKEN to your .env file');
    process.exit(1);
  }

  // 测试用的图片 URL (使用一个公开的测试图片)
  const testImageUrl = 'https://picsum.photos/300/200';
  const fileName = generateFileName(testImageUrl, 'test');

  try {
    // 测试 isSmmsUrl 函数
    console.log('🔍 Testing URL detection...');
    console.log(`Is SM.MS URL (should be false): ${isSmmsUrl(testImageUrl)}`);
    console.log(`Is SM.MS URL (should be true): ${isSmmsUrl('https://i.loli.net/test.jpg')}`);
    console.log(`Is SM.MS URL (should be true): ${isSmmsUrl('https://s2.loli.net/test.jpg')}`);
    console.log();

    // 测试文件名生成
    console.log('📝 Testing filename generation...');
    console.log(`Generated filename: ${fileName}`);
    console.log();

    // 测试图片上传
    console.log('📤 Testing image upload...');
    console.log(`Uploading test image: ${testImageUrl}`);

    const uploadResult = await smmsUploadExternal(testImageUrl, fileName);
    const smmsUrl = getSmmsUrl(uploadResult);

    if (smmsUrl) {
      console.log('✅ Image upload successful!');
      console.log(`📷 Original URL: ${testImageUrl}`);
      console.log(`🌐 SM.MS URL: ${smmsUrl}`);
      console.log();
      console.log('Upload result:', JSON.stringify(uploadResult, null, 2));
    } else {
      console.error('❌ Failed to get SM.MS URL from upload result');
      console.log('Upload result:', JSON.stringify(uploadResult, null, 2));
    }
  } catch (error) {
    console.error('❌ Test failed:', error);

    if (error instanceof Error) {
      if (error.message.includes('401')) {
        console.log('\n💡 This might be due to an invalid API token.');
        console.log('Please check your SMMS_API_TOKEN in the .env file.');
      } else if (error.message.includes('403')) {
        console.log('\n💡 This might be due to API rate limiting.');
        console.log('Please wait a moment and try again.');
      } else if (error.message.includes('image_repeated')) {
        console.log('\n💡 This image was already uploaded to SM.MS.');
        console.log('This is actually a success case - the API returns the existing URL.');
      }
    }
  }
}

// 运行测试
if (require.main === module) {
  testImageUpload();
}
