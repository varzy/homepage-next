import Link from 'next/link';
import PageHeader from '@/app/_components/PageHeader';

export default function BlogHeader() {
  const links = [
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
