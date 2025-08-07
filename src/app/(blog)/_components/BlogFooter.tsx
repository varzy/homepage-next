import { SITE_CONFIG } from '@/site.config';
import Link from 'next/link';

const FOOTER_LINKS = [
  // { label: 'Tags', href: '/tags' },
  { label: 'RSS', href: '/rss.xml' },
  { label: 'Github', href: 'https://github.com/varzy/homepage-next' },
  { label: 'Sponsor', href: '/sponsor' },
];

export default function BlogFooter() {
  return (
    <footer>
      <div className="g-blog-container">
        <hr className="border-gray-200" />
        <div className="flex items-center justify-between pt-8 pb-36 text-sm">
          <p>
            &copy; {SITE_CONFIG.author} 2015 - {new Date().getFullYear()}
          </p>
          <p>
            {FOOTER_LINKS.map((link, index) => (
              <span key={index}>
                {index > 0 && ' • '}
                <Link className="underline" href={link.href}>
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
