import { NextResponse } from 'next/server';
import { getAllPosts } from '@/app/(blog)/_lib/content-loader';
import { generateRSSFeed, generateRSSHeaders } from '@/utils/rss';

export async function GET() {
  try {
    const posts = await getAllPosts();

    const rssXml = generateRSSFeed(posts);

    return new NextResponse(rssXml, {
      status: 200,
      headers: generateRSSHeaders(),
    });
  } catch (error) {
    console.error('Error generating RSS feed:', error);

    return new NextResponse('Internal Server Error', {
      status: 500,
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  }
}

// 为了兼容性，也处理其他 HTTP 方法
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: generateRSSHeaders(),
  });
}
