import Link from 'next/link';
import { SITE_CONFIG } from '@/site.config';

export default function BlogHeader() {
  const categoriesConfig = SITE_CONFIG.categories;
  const categoryLinks = Object.keys(categoriesConfig).map((key) => {
    const category = categoriesConfig[key as keyof typeof categoriesConfig];
    return { label: category.alias, href: `/categories/${key}` };
  });
  const links = [{ label: '首页', href: '/' }, ...categoryLinks, { label: '朋友们', href: '/friends' }];

  return (
    <header className="shadow-md">
      <div className="g-content-container">
        <div className="flex justify-between align-center">
          <div className="logo">LOGO</div>
          <div className="menu flex align-center">
            {links.map((link, index) => (
              <Link className="mr-2 last:mr-0" key={index} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
