import Link from 'next/link';
import { PostMeta as PostMetaData } from '@/app/_lib/post-loader';
import PostMeta from './PostMeta';

export default function PostItem({
  showCategory = true,
  showTags = true,
  dateTpl = 'MMM DD, YYYY',
  ...post
}: PostMetaData & { showCategory?: boolean; showTags?: boolean; dateTpl?: string }) {
  return (
    <div className="mb-8 last:mb-0 sm:mb-10">
      <PostMeta post={post} showCategory={showCategory} showTags={showTags} dateTpl={dateTpl} />
      <h2 className="text-ink py-1.5 text-base font-extrabold sm:py-2 sm:text-lg">
        <Link className="hover:underline" href={'/posts/' + post.slug}>
          {post.title}
        </Link>
      </h2>
      {post.summary && <p className="text-muted text-sm sm:text-base">{post.summary}</p>}
    </div>
  );
}
