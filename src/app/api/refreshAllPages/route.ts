import { composeDatabaseQuery, getAllPagesWithMeta } from '@/app/(blog)/_lib/notion-handler';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  revalidatePath('/', 'layout');
  console.log('[refreshAllPages] All cache has been cleared.');

  const allPages = await getAllPagesWithMeta(composeDatabaseQuery());
  for (const page of allPages) {
    const url = `https://varzy.me/posts/${page.slug}`;
    await fetch(url, { cache: 'no-cache' });
    console.log(`[refreshAllPages] url has been refreshed: ${url}`);
  }

  return Response.json({ ok: true, code: 'REFRESHED' }, { status: 200 });
}
