import { SITE_CONFIG } from '@/site.config';
import Link from 'next/link';

const FOOTER_LINKS = [
  { label: 'Tags', href: '/tags' },
  { label: 'RSS', href: '/rss' },
];

const POWERED_BY_LINKS = [
  { label: 'Next.js', href: 'https://nextjs.org/', external: true },
  { label: 'Notion', href: 'https://notion.so', external: true },
  { label: 'Vercel', href: 'https://vercel.com/', external: true },
];

export default function BlogFooter() {
  return (
    <footer>
      <div className="g-blog-container">
        <hr className="border-gray-200" />
        <div className="pb-14 pt-6 text-sm">
          <p>
            &copy; {SITE_CONFIG.author} 2015 - {new Date().getFullYear()}
            {FOOTER_LINKS.map((link, index) => (
              <span key={index}>
                &nbsp;•&nbsp;
                <Link className="underline" href={link.href}>
                  {link.label}
                </Link>
              </span>
            ))}
          </p>
          <p className="mt-2">
            Powered by{' '}
            {POWERED_BY_LINKS.map((link, index) => (
              <span key={index}>
                <Link className="underline" href={link.href} target={link.external ? '_blank' : undefined}>
                  {link.label}
                </Link>
                {index < POWERED_BY_LINKS.length - 1 && (
                  <span>{index === POWERED_BY_LINKS.length - 2 ? ' & ' : ', '}</span>
                )}
              </span>
            ))}{' '}
            . View Source on&nbsp;
            <Link className="underline" href="https://github.com/varzy/homepage-next" target="_blank">
              Github
            </Link>
            .
          </p>
        </div>
      </div>
    </footer>
  );
}
