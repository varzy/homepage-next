import {
  composeDatabaseQuery,
  getPageBySlug,
  markPageImagesHasBeenUploadedToSmms,
  replaceNotionImageWithSmms,
} from '@/app/(blog)/_lib/notion-handler';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (!slug) return Response.json({ ok: false, code: `NO_SLUG` }, { status: 400 });

  const targetPost = await getPageBySlug(composeDatabaseQuery(), slug);
  if (!targetPost) return Response.json({ ok: false, code: `NO_PAGE` }, { status: 404 });

  if (targetPost.isSmmsImages) return Response.json({ ok: true, code: 'HAS_BEEN_SMMS_IMAGES' });

  await replaceNotionImageWithSmms(targetPost.id, slug);
  await markPageImagesHasBeenUploadedToSmms(targetPost.id);
  return Response.json({ ok: true, code: 'REPLACED' }, { status: 200 });
}
