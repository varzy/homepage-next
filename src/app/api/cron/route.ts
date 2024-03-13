import { composeDatabaseQuery, getAllPagesWithMeta } from '@/app/(blog)/_lib/notion-handler';
import dayjs from 'dayjs';
import { revalidatePath } from 'next/cache';

export async function GET() {
  console.log(`[keepNotionImageAlive] Ready to refresh pages...`);
  revalidatePath('/', 'layout');

  const allPages = await getAllPagesWithMeta(composeDatabaseQuery());
  const slugs = allPages.map((page) => page.slug);
  for (const slug of slugs) {
    const url = `https://varzy.me/posts/${slug}`;
    await fetch(url, { cache: 'no-cache' });
    console.log(`[keepNotionImageAlive] ${url} has been refreshed.`);
  }
  console.log(`[keepNotionImageAlive] All pages has been refreshed!`);

  return Response.json({ currentTime: dayjs().format('YYYY-MM-DD HH:mm:ss'), refreshed: slugs });
}
