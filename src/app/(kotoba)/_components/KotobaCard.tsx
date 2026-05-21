import { MDXRemote } from 'next-mdx-remote/rsc';
import { KotobaPostWithContent } from '@/app/_lib/content-loader';
import { extractImagesFromMdx } from '../_lib/kotoba-utils';
import KotobaImageGrid from './KotobaImageGrid';

// MDX component overrides for card context
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CardLink = (props: any) => (
  <a target="_blank" rel="noopener noreferrer" {...props} />
);

interface KotobaCardProps {
  post: KotobaPostWithContent;
}

export default function KotobaCard({ post }: KotobaCardProps) {
  const { images, cleanContent } = extractImagesFromMdx(post.content);
  const hasContent = cleanContent.length > 0;

  return (
    <article className="flex gap-4 border-b border-gray-100 py-6 last:border-0 sm:gap-6">
      {/* Left: date */}
      <time
        dateTime={post.publishedDate}
        className="text-secondary w-20 shrink-0 pt-0.5 text-xs sm:w-24 sm:text-sm"
      >
        {post.publishedDate}
      </time>

      {/* Right: body */}
      <div className="min-w-0 flex-1">
        {/* Title */}
        {post.withTitle && post.title && (
          <div className="mb-2 font-bold text-black">
            {post.titleUrl ? (
              <a
                href={post.titleUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {post.title}
              </a>
            ) : (
              post.title
            )}
          </div>
        )}

        {/* Content */}
        {hasContent && (
          <article className="prose prose-sm prose-code:before:content-none prose-code:after:content-none prose-a:font-normal prose-a:text-inherit prose-a:decoration-1 prose-blockquote:[&_p]:before:content-none prose-blockquote:[&_p]:after:content-none max-w-none leading-relaxed break-words">
            <MDXRemote source={cleanContent} components={{ a: CardLink }} />
          </article>
        )}

        {/* Image grid */}
        <KotobaImageGrid images={images} />
      </div>
    </article>
  );
}
