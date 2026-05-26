import { Suspense } from 'react';
import BlogHeader from '@/app/(blog)/_components/BlogHeader';
import SiteFooter from '@/app/_components/SiteFooter';
import Loading from './loading';

export default function BlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
      <BlogHeader />
      <Suspense fallback={<Loading />}>
        <main>{children}</main>
      </Suspense>
      <SiteFooter
        links={[
          {
            label: 'CC BY-NC 4.0',
            href: 'https://creativecommons.org/licenses/by-nc/4.0/',
            target: '_blank',
          },
          { label: 'RSS', href: '/rss.xml' },
        ]}
      />
    </div>
  );
}
