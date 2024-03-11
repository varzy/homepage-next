import { PostMetaData } from '@/app/(blog)/_lib/notion-handler';
import Link from 'next/link';

export default function PostItem(post: PostMetaData) {
  return (
    <Link className="post_link group flex flex-wrap justify-between rounded py-5 md:py-6" href={'/posts/' + post.slug}>
      <div className="mb-1 flex w-full shrink-0 text-xs text-gray-400 md:mb-0 md:w-1/6 md:text-base">
        {post.dateAmericaStyle}
      </div>
      <div className="flex-1">
        <h2 className="font-bold group-hover:text-indigo-500 group-hover:transition-all group-hover:duration-300 group-hover:ease-in-out">
          {post.title}
        </h2>
        <p className="mt-2 text-sm">{post.summary}</p>
      </div>
    </Link>
  );
}
