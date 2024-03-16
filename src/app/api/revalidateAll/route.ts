import { revalidatePath } from 'next/cache';

export function GET() {
  revalidatePath('/', 'layout');
  return Response.json({ ok: true });
}
