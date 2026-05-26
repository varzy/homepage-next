import Link from 'next/link';
import { SITE_CONFIG } from '@/site.config';

export type FooterLink = {
  label: string;
  href: string;
  target?: '_self' | '_blank';
};

export default function SiteFooter({ links }: { links: FooterLink[] }) {
  return (
    <footer className="g-container pt-20 pb-12 text-sm [&_a]:hover:underline">
      <div className="mt-5 flex items-center justify-between">
        <p>
          <span>
            &copy; 2015 - {new Date().getFullYear()} <Link href="/">{SITE_CONFIG.author}</Link>
          </span>
        </p>
        <p>
          {links.map((link, index) => (
            <span key={index}>
              {index > 0 && <span className="mx-2">·</span>}
              <Link href={link.href} target={link.target ?? '_self'}>
                {link.label}
              </Link>
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
