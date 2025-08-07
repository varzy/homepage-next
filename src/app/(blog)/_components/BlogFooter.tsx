import { SITE_CONFIG } from '@/site.config';
import Link from 'next/link';

const FOOTER_LINKS = [
  { label: 'RSS', href: '/rss.xml', target: '_blank' },
  { label: 'Github', href: 'https://github.com/varzy/homepage-next', target: '_blank' },
  { label: 'Sponsor', href: '/sponsor', target: '_self' },
];

export default function BlogFooter() {
  return (
    <footer>
      <div className="g-blog-container pb-36 text-sm">
        <hr className="my-8 border-gray-200" />
        <div className="flex items-center justify-between">
          <p>
            &copy; {SITE_CONFIG.author} 2015 - {new Date().getFullYear()}
          </p>
          <p>
            {FOOTER_LINKS.map((link, index) => (
              <span key={index}>
                {index > 0 && <span className="mx-1.5">•</span>}
                <Link className="underline" href={link.href} target={link.target}>
                  {link.label}
                </Link>
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  );
}
