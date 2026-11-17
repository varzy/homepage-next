import Link from 'next/link';
import { SITE_CONFIG } from '@/site.config';

export type FooterLink = {
  label: string;
  href: string;
  target?: '_self' | '_blank';
};

export default function SiteFooter({ links = [] }: { links?: FooterLink[] }) {
  const footerLinks = [...links];

  return (
    <footer className="g-container pt-20 pb-16 text-sm [&_a]:hover:underline">
      <div className="mt-5">
        <span>
          &copy; 2015 - {new Date().getFullYear()} <Link href="/">{SITE_CONFIG.author}</Link>
        </span>
        <nav aria-label="页脚导航" className="inline">
          <ul className="m-0 inline list-none p-0">
            {footerLinks.map((link, index) => (
              <li key={index} className="inline">
                <span className="mx-2" aria-hidden="true">
                  ·
                </span>
                <Link href={link.href} className="nowrap" target={link.target ?? '_self'}>
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
