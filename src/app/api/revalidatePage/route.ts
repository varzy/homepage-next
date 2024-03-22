import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  if (!path) return Response.json({ ok: false, code: `NO_PAGE_PARAM` }, { status: 400 });

  revalidatePath(path, 'page');
  return Response.json({ ok: true });
}
