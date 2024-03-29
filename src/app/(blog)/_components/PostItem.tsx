import { PostMetaData } from '@/app/(blog)/_lib/notion-handler';
import Link from 'next/link';

export default function PostItem(post: PostMetaData) {
  return (
    <Link
      className="post_link  group mb-8 flex flex-wrap justify-between rounded  last:mb-0 sm:mb-10"
      href={'/posts/' + post.slug}
    >
      <div className="mb-1 flex w-full shrink-0 text-xs text-gray-400 md:mb-0 md:w-1/6 md:text-base">
        {post.dateAmericaStyle}
      </div>
      <div className="flex-1">
        <h2 className="font-bold sm:group-hover:underline">{post.title}</h2>
        {post.summary && <p className="mt-1 text-sm">{post.summary}</p>}
      </div>
    </Link>
  );
}
