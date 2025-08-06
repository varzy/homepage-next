import BlogHeader from '@/app/(blog)/_components/BlogHeader';
import BlogFooter from '@/app/(blog)/_components/BlogFooter';
import { Suspense } from 'react';
import Loading from './loading';

export default function BlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <BlogHeader />
      <Suspense fallback={<Loading />}>
        <main>{children}</main>
      </Suspense>
      <BlogFooter />
    </>
  );
}
