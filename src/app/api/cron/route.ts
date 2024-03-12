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
        { property: 'type', select: { equals: 'Post' } }
      ]
    }
  });
  const slugs = allPages.map(page => page.slug);
  slugs.forEach(slug => {
    fetch(`https://varzy.me/posts/${slug}`).catch(e => {
      console.error(e);
      return;
    });
    console.log(`[keepNotionImageAlive] /posts/${slug} has been refreshed.`);
  });

  return Response.json({ ok: true, refreshed: slugs, currentTime: dayjs().format('YYYY-MM-DD HH:mm:ss') });
}
