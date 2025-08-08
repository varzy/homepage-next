import { SITE_CONFIG } from '@/site.config';
import Link from 'next/link';

const FOOTER_LINKS = [
  { label: 'RSS', href: '/rss.xml', target: '_blank' },
  { label: 'Github', href: 'https://github.com/varzy/homepage-next', target: '_blank' },
  { label: 'Sponsor', href: '/sponsor', target: '_self' },
];

export default function BlogFooter() {
  return (
    <footer className="g-container pt-18 pb-12 text-sm [&_a]:hover:underline">
      <div className="mt-5 flex items-center justify-between">
        <p>
          &copy; <Link href="/">{SITE_CONFIG.author}</Link> 2015 - {new Date().getFullYear()}
        </p>
        <p>
          {FOOTER_LINKS.map((link, index) => (
            <span key={index}>
              {index > 0 && <span className="mx-1.5">·</span>}
              <Link href={link.href} target={link.target}>
                {link.label}
              </Link>
            </span>
          ))}
        </p>
      </div>
    </footer>
  );
}
