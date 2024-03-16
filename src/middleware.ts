import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api')) {
    const callingToken = request.nextUrl.searchParams.get('token');
    if (callingToken !== process.env.API_CALLING_TOKEN)
      return NextResponse.json({ ok: false, code: 'ERROR_CALLING_TOKEN' }, { status: 401 });
  }
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/api/:path*',
};
