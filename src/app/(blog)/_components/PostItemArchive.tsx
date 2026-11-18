import Link from 'next/link';
import { type PostMeta as PostMetaData } from '@/app/_lib/post-loader';
import { formatAbsoluteDate } from '@/utils/date';

export default function PostItem({
  dateTpl = 'MMM DD',
  ...post
}: PostMetaData & { dateTpl?: string }) {
  return (
    <article className="mb-3 block last:mb-0">
      <div className="flex gap-3">
        <time className="text-secondary pt-0.5 text-sm" dateTime={post.date}>
          {formatAbsoluteDate(post.date, dateTpl)}
        </time>
        <h3 className="text-ink flex-1 leading-6">
          <Link href={'/posts/' + post.slug} className="hover:underline">
            {post.title}
          </Link>
        </h3>
      </div>
    </article>
  );
}
