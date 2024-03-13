import { getAllPagesWithMeta } from '@/app/(blog)/_lib/notion-handler';
import { SITE_CONFIG } from '@/site.config';
import dayjs from 'dayjs';

export async function GET() {
  console.log(`[keepNotionImageAlive] Ready to refresh pages...`);
  const allPages = await getAllPagesWithMeta({
    database_id: SITE_CONFIG.notionDatabaseId,
    filter: {
      and: [
        { property: 'status', select: { equals: 'Published' } },
        { property: 'type', select: { equals: 'Post' } },
      ],
    },
  });
  const slugs = allPages.map((page) => page.slug);
  for (const slug of slugs) {
    const url = `https://varzy.me/posts/${slug}`;
    const res = await fetch(url, { cache: 'no-cache' });
    console.log(res.text());
    console.log(`[keepNotionImageAlive] ${url} has been refreshed.`);
  }
  console.log(`[keepNotionImageAlive] All pages has been refreshed!`);

  return Response.json({ currentTime: dayjs().format('YYYY-MM-DD HH:mm:ss'), refreshed: slugs });
}
