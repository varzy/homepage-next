import { NextResponse } from 'next/server';
import dayjs from 'dayjs';

export async function GET() {
  await fetch(`https://www.varzy.me/posts/hello-blog`, { cache: 'no-cache' });
  return NextResponse.json({ ok: true, triggered: dayjs().format('YYYY-MM-DD HH:mm:ss') });
}
