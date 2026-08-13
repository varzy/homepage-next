import { Suspense } from 'react';
import SiteFooter from '@/app/_components/SiteFooter';
import SiteHeader from '@/app/_components/SiteHeader';
import Loading from '../loading';

export default function BlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div>
      <SiteHeader
        links={[
          { label: '文章', href: '/blog' },
          { label: '栏目', href: '/columns' },
          { label: '归档', href: '/archive' },
          { label: 'RSS', href: '/rss.xml', target: '_blank' },
        ]}
      />
      <Suspense fallback={<Loading />}>
        <main>{children}</main>
      </Suspense>
      <SiteFooter />
    </div>
  );
}
