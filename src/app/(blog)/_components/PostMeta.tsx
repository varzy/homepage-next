import Link from 'next/link';
import { PostMeta as PostMetaData } from '@/app/_lib/post-loader';
import { formatAbsoluteDate } from '@/utils/date';

export default function PostMeta({
  post,
  showCategory = true,
  showTags = true,
  showYear = true,
}: {
  post: PostMetaData;
  showCategory?: boolean;
  showTags?: boolean;
  showYear?: boolean;
}) {
  const hasCategory = showCategory && post.categoryKey;
  const hasTags = showTags && post.tags.length > 0;

  return (
    <span className="text-secondary text-sm">
      {formatAbsoluteDate(post.date, showYear)}
      {hasCategory && (
        <>
          <span>, in </span>
          <Link className="text-ink hover:underline" href={`/categories/${post.categoryKey}`}>
            {post.categoryAlias}
          </Link>
        </>
      )}
      {hasTags && (
        <span className="ms-3">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              className="text-ink me-2 last:me-0 hover:underline"
              href={`/tags/${tag}`}
            >
              #{tag}
            </Link>
          ))}
        </span>
      )}
    </span>
  );
}
