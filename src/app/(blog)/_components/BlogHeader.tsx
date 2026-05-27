import Link from 'next/link';
import PageHeader from '@/app/_components/PageHeader';
import { SITE_CONFIG } from '@/site.config';

export default function BlogHeader() {
  const categoriesConfig = SITE_CONFIG.categories;
  const categoryLinks = Object.keys(categoriesConfig).map((key) => {
    const category = categoriesConfig[key as keyof typeof categoriesConfig];
    return { label: category.alias, href: `/categories/${key}` };
  });
  const links = [
    // ...categoryLinks,
    { label: '文章', href: '/blog' },
    { label: '专栏', href: '/columns' },
    { label: '归档', href: '/archive' },
  ];

  return (
    <PageHeader>
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
    </PageHeader>
  );
}
