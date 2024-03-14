import { PostMetaData } from '@/app/(blog)/_lib/notion-handler';
import Link from 'next/link';

export default function PostItem(post: PostMetaData) {
  return (
    <Link prefetch={false} className="post_link  flex flex-wrap justify-between rounded mb-8 sm:mb-10  last:mb-0 group" href={'/posts/' + post.slug}>
      <div className="mb-1 flex w-full shrink-0 text-xs text-gray-400 md:mb-0 md:w-1/6 md:text-base">
        {post.dateAmericaStyle}
      </div>
      <div className="flex-1">
        <h2 className="font-bold sm:group-hover:underline">{post.title}</h2>
        <p className="mt-1 text-sm">{post.summary}</p>
      </div>
    </Link>
  );
}
