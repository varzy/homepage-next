import Link from 'next/link';
import { SITE_CONFIG } from '@/site.config';

export type FooterLink = {
  label: string;
  href: string;
  target?: '_self' | '_blank';
};

export default function SiteFooter({ links = [] }: { links?: FooterLink[] }) {
  const footerLinks = [
    {
      label: 'CC BY-NC-SA 4.0',
      href: 'https://creativecommons.org/licenses/by-nc-sa/4.0',
      target: '_blank',
    },
    ...links,
  ];

  return (
    <footer className="g-container pt-20 pb-16 text-sm [&_a]:hover:underline">
      <div className="mt-5 flex items-center">
        <span>
          &copy; 2015 - {new Date().getFullYear()} <Link href="/">{SITE_CONFIG.author}</Link>
        </span>
        <span className="mx-2" aria-hidden="true">
          ·
        </span>
        <nav aria-label="页脚导航">
          <ul className="m-0 flex list-none items-center p-0">
            {footerLinks.map((link, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2" aria-hidden="true">
                    ·
                  </span>
                )}
                <Link href={link.href} target={link.target ?? '_self'}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
