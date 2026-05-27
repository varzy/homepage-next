import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { KotobaPostWithContent } from '@/app/_lib/kotoba-loader';
import { formatAbsoluteDate, formatRelativeDate } from '@/utils/date';
import { extractImagesFromMdx } from '../_lib/kotoba-utils';
import KotobaImageGrid from './KotobaImageGrid';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CardLink = (props: any) => <a target="_blank" rel="noopener noreferrer" {...props} />;

interface KotobaCardProps {
  post: KotobaPostWithContent;
}

export default function KotobaCard({ post }: KotobaCardProps) {
  const { images, cleanContent } = extractImagesFromMdx(post.content);
  const hasContent = cleanContent.length > 0;
  const publishedTimeLabel = formatAbsoluteDate(post.publishedDate, 'MM/DD/YYYY HH:mm');
  const publishedRelativeNowLabel = formatRelativeDate(post.publishedDate);
  const displayDate = `${publishedRelativeNowLabel} · ${publishedTimeLabel} `;

  return (
    <article className="bg-surface border-border mb-4 p-5 sm:p-8">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        {displayDate && (
          <time className="text-secondary" dateTime={post.publishedDate}>
            {displayDate}
          </time>
        )}
        {post.tags.map((tag) => (
          <Link
            key={tag}
            href={`/kotoba/tags/${encodeURIComponent(tag)}`}
            className="hover:underline"
          >
            #{tag}
          </Link>
        ))}
      </div>

      <hr className="border-border-soft" />

      {post.withTitle && post.title && (
        <div className="text-ink py-1.5 font-bold sm:py-2">
          {post.titleUrl ? (
            <Link
              href={post.titleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {post.title}
            </Link>
          ) : (
            post.title
          )}
        </div>
      )}

      {hasContent && (
        <div className="prose dark:prose-invert prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-blockquote:my-3 prose-code:before:content-none prose-code:after:content-none prose-a:font-normal prose-a:text-inherit prose-a:decoration-1 prose-blockquote:[&_p]:before:content-none prose-blockquote:[&_p]:after:content-none max-w-none text-[15px] leading-relaxed wrap-break-word">
          <MDXRemote source={cleanContent} components={{ a: CardLink }} />
        </div>
      )}

      <KotobaImageGrid images={images} />
    </article>
  );
}
