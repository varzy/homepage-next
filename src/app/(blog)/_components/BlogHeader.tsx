import Link from 'next/link';
import { SITE_CONFIG } from '@/site.config';

export default function BlogHeader() {
  const categoriesConfig = SITE_CONFIG.categories;
  const categoryLinks = Object.keys(categoriesConfig).map((key) => {
    const category = categoriesConfig[key as keyof typeof categoriesConfig];
    return { label: category.alias, href: `/categories/${key}` };
  });
  const links = [
    ...categoryLinks,
    { label: '归档', href: '/archive' },
    { label: '标签', href: '/tags' },
    { label: '朋友们', href: '/friends' },
  ];

  return (
    <header className="py-8">
      <div className="g-container">
        <div className="flex items-center justify-between">
          <Link className="text-lg font-bold italic" href="/">
            贼 歪
          </Link>

          <nav>
            <ul className="menu align-center flex gap-4">
              {links.map((link, index) => (
                <li key={index}>
                  <Link className="hover:underline" href={link.href}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
