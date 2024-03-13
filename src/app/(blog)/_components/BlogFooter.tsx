import { SITE_CONFIG } from '@/site.config';
import Link from 'next/link';

export default function BlogFooter() {
  return (
    <footer>
      <div className="g-blog-container">
        <hr className="border-gray-200" />
        <div className="pb-16 pt-6 text-sm leading-6">
          <p>
            &copy; {SITE_CONFIG.author} 2015 - {new Date().getFullYear()}
            &nbsp;•&nbsp;
            <Link className="underline" href="/tags">
              Tags
            </Link>
            &nbsp;•&nbsp;
            <Link className="underline" href="/rss">
              RSS
            </Link>
          </p>
          <p>
            Powered by{' '}
            <Link className="underline" href="https://vercel.com/" target="_blank">
              Vercel
            </Link>
            ,{' '}
            <Link className="underline" href="https://nextjs.org/" target="_blank">
              Next.js
            </Link>{' '}
            &{' '}
            <Link className="underline" href="https://varzy.notion.site">
              Notion
            </Link>
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
