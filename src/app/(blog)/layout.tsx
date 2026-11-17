import SiteHeader from '@/app/_components/SiteHeader';

export default function BlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader
        links={[
          { label: '文章', href: '/blog' },
          { label: '栏目', href: '/columns' },
          { label: '归档', href: '/archive' },
          { label: 'RSS', href: '/rss.xml', target: '_blank' },
        ]}
      />
      <main className="g-container-content">{children}</main>
    </>
  );
}
