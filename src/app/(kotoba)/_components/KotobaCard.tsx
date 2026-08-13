import Link from 'next/link';
import MdxRenderer from '@/app/_components/MdxRenderer';
import { KotobaPostWithContent } from '@/app/_lib/kotoba-loader';
import { formatAbsoluteDate } from '@/utils/date';
import { extractImagesFromMdx } from '../_lib/kotoba-utils';
import KotobaImageGrid from './KotobaImageGrid';
import KotobaProse from './KotobaProse';

interface KotobaCardProps {
  post: KotobaPostWithContent;
}

export default function KotobaCard({ post }: KotobaCardProps) {
  const { images, cleanContent } = extractImagesFromMdx(post.content);
  const hasContent = cleanContent.length > 0;
  const publishedTimeLabel = formatAbsoluteDate(post.publishedDate, 'MMM DD, YYYY HH:mm');

  return (
    <section className="bg-surface border-border mb-4 p-6">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
        {publishedTimeLabel && (
          <time className="text-secondary" dateTime={post.publishedDate}>
            {publishedTimeLabel}
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
        <div className="text-ink text-paragraph my-4 font-extrabold">
          {post.titleUrl ? (
            <Link
              href={post.titleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {post.title}
            </Link>
          ) : (
            post.title
          )}
        </div>
      )}

      {hasContent && (
        <KotobaProse>
          <MdxRenderer source={cleanContent} withProse={false}></MdxRenderer>
        </KotobaProse>
      )}

      <KotobaImageGrid images={images} />
    </section>
  );
}
