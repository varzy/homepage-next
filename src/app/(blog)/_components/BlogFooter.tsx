import { SITE_CONFIG } from '@/site.config';
import Link from 'next/link';

export default function BlogFooter() {
  return (
    <footer>
      <div className="g-content-container">
        <hr className="border-gray-200" />
        <div className="pb-8 pt-4 text-sm leading-6">
          <p>
            &copy; {SITE_CONFIG.author} 2015 - {new Date().getFullYear()} • Powered by Vercel, Next.js & Notion.
          </p>
          <p>
            View Source on&nbsp;
            <Link className="g-link" href="https://github.com/varzy/homepage-next" target="_blank">
              Github
            </Link>
            &nbsp;•&nbsp;
            <Link className="g-link" href="/tags">
              Tags
            </Link>
            &nbsp;•&nbsp;
            <Link className="g-link" href="/rss">
              RSS
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
