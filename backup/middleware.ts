// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { postVisitingMap } from '@/utils/postVisiting';
// import { revalidatePath } from 'next/cache';
//
// export async function middleware(request: NextRequest) {
//   const pathname = request.nextUrl.pathname;
//   const now = +new Date();
//
//   // 如果距离上次访问时间超过 50min，则先行拉取一次以消除 revalidate 无法即使触发的问题
//   const postLastVisitedTime = postVisitingMap[pathname] || 0;
//   const needRefresh = now - postLastVisitedTime > 1000 * 60 * 50;
//   console.log(
//     `[Middleware] Now: ${now}; Last Visited: ${postLastVisitedTime}; Diff: ${now - postLastVisitedTime}; Need Refresh: ${needRefresh}`,
//   );
//   if (needRefresh) {
//     postVisitingMap[pathname] = now;
//     if (postLastVisitedTime > 0) revalidatePath(pathname);
//     await fetch(request.url);
//   }
//
//   return NextResponse.next();
// }
//
// // See "Matching Paths" below to learn more
// export const config = {
//   matcher: '/posts/:path*',
// };
