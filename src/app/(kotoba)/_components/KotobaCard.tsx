import { MDXRemote } from 'next-mdx-remote/rsc';
import Link from 'next/link';
import { KotobaPostWithContent } from '@/app/_lib/kotoba-loader';
import { formatDisplayDate } from '@/utils/date';
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
  const displayDate = formatDisplayDate(post.publishedDate);

  return (
    <article className="mb-4 border-black/10 bg-white p-5 sm:p-8">
      <div className="text-secondary mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        {displayDate && <time dateTime={post.publishedDate}>{displayDate}</time>}
        {post.tags.map((tag) => (
          <Link
            key={tag}
            href={`/kotoba/tags/${encodeURIComponent(tag)}`}
            className="hover:text-black"
          >
            #{tag}
          </Link>
        ))}
      </div>

      <hr className="border-black/5" />

      {post.withTitle && post.title && (
        <div className="py-1.5 font-bold text-black sm:py-2">
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
        <div className="prose prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-blockquote:my-3 prose-code:before:content-none prose-code:after:content-none prose-a:font-normal prose-a:text-inherit prose-a:decoration-1 prose-blockquote:[&_p]:before:content-none prose-blockquote:[&_p]:after:content-none max-w-none text-[15px] leading-relaxed wrap-break-word">
          <MDXRemote source={cleanContent} components={{ a: CardLink }} />
        </div>
      )}

      <KotobaImageGrid images={images} />
    </article>
  );
}
