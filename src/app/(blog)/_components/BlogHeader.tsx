import Link from 'next/link';
import { SITE_CONFIG } from '@/site.config';

export default function BlogHeader() {
  const categoriesConfig = SITE_CONFIG.categories;
  const categoryLinks = Object.keys(categoriesConfig).map((key) => {
    const category = categoriesConfig[key as keyof typeof categoriesConfig];
    return { label: category.alias, href: `/categories/${key}` };
  });
  const links = [
    { label: '主页', href: '/' },
    ...categoryLinks,
    { label: '归档', href: '/archive' },
    { label: '标签', href: '/tags' },
    { label: '朋友们', href: '/friends' },
  ];

  return (
    <header className="relative z-50 py-8">
      <div className="g-blog-container">
        <div className="flex items-center justify-between">
          <div className="logo">
            <Link className="text-lg font-bold italic transition-all duration-300 ease-in-out" href="/blog">
              贼 歪
            </Link>
          </div>
          <div className="menu align-center flex gap-3 sm:gap-3.5">
            {links.map((link, index) => (
              <Link className="transition-all duration-300 ease-in-out hover:underline" key={index} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
