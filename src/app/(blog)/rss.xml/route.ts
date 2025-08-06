import { NextResponse } from 'next/server';
import { getAllPosts, type PostMeta } from '@/app/(blog)/_lib/content-loader';
import RSS from 'rss';
import { SITE_CONFIG } from '@/site.config';

function generateRSSFeed(posts: PostMeta[]): string {
  const feed = new RSS({
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    feed_url: `${SITE_CONFIG.siteUrl}${SITE_CONFIG.feedPath}`,
    site_url: SITE_CONFIG.siteUrl,
    language: SITE_CONFIG.lang,
    copyright: `© ${new Date().getFullYear()} ${SITE_CONFIG.author}`,
    managingEditor: SITE_CONFIG.author,
    webMaster: SITE_CONFIG.author,
    generator: 'homepage-next',
    docs: 'https://www.rssboard.org/rss-specification',
    ttl: 60,
  });

  posts.forEach((post) => {
    const postUrl = `${SITE_CONFIG.siteUrl}/posts/${post.slug}`;

    feed.item({
      title: post.title,
      description: post.summary || post.title,
      url: postUrl,
      guid: postUrl,
      date: new Date(post.date),
      categories: [post.category, ...post.tags],
      author: SITE_CONFIG.author,
    });
  });

  return feed.xml({ indent: true });
}

function generateRSSHeaders(): Record<string, string> {
  return {
    'Content-Type': 'text/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD',
  };
}

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
