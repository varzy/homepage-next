import Link from 'next/link';
import { SITE_CONFIG } from '@/site.config';

export default function BlogHeader() {
  const categoriesConfig = SITE_CONFIG.categories;
  const categoryLinks = Object.keys(categoriesConfig).map((key) => {
    const category = categoriesConfig[key as keyof typeof categoriesConfig];
    return { label: category.alias, href: `/categories/${key}` };
  });
  const links = [{ label: '主页', href: '/' }, ...categoryLinks, { label: '朋友们', href: '/friends' }];

  return (
    <header className="relative z-50 py-4">
      <div className="g-blog-container">
        <div className="flex items-center justify-between">
          <div className="logo">
            <Link className="hover:g-blog-link text-lg font-bold italic" href="/blog">
              贼 歪
            </Link>
          </div>
          <div className="menu align-center flex">
            {links.map((link, index) => (
              <Link className="hover:g-blog-link mr-3.5 last:mr-0" key={index} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
