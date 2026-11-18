import Link from 'next/link';
import { PostMeta as PostMetaData } from '@/app/_lib/post-loader';
import { formatAbsoluteDate } from '@/utils/date';

export default function PostMeta({
  post,
  showCategory = true,
  showTags = true,
  dateTpl = 'MMM DD, YYYY',
}: {
  post: PostMetaData;
  showCategory?: boolean;
  showTags?: boolean;
  dateTpl?: string;
}) {
  const hasCategory = showCategory && post.categoryKey;
  const hasTags = showTags && post.tags.length > 0;

  return (
    <div className="text-secondary text-sm">
      <time dateTime={post.date}>{formatAbsoluteDate(post.date, dateTpl)}</time>
      {hasCategory && (
        <span className="ms-2">
          「
          <Link className="text-ink hover:underline" href={`/categories/${post.categoryKey}`}>
            {post.categoryAlias}
          </Link>
          」
        </span>
      )}
      {hasTags && (
        <span>
          {post.tags.map((tag) => (
            <Link key={tag} className="text-ink ms-2 hover:underline" href={`/tags/${tag}`}>
              #{tag}
            </Link>
          ))}
        </span>
      )}
    </div>
  );
}
