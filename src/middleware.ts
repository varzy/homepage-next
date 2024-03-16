import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SITE_CONFIG } from './site.config';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  /**
   * Require api secret calling token at production env.
   */
  if (request.nextUrl.pathname.startsWith('/api')) {
    const callingToken = request.nextUrl.searchParams.get('token');
    if (SITE_CONFIG.isProd && callingToken !== SITE_CONFIG.apiCallingToken) {
      return NextResponse.json({ ok: false, code: 'ERROR_CALLING_TOKEN' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
// export const config = {
//   matcher: '/api/:path*',
// };
