import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export function GET() {
  revalidatePath('/', 'layout');
  return Response.json({ ok: true });
}
