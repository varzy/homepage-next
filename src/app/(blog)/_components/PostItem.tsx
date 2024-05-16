import { PostMetaData } from '@/app/(blog)/_lib/notion-handler';
import Link from 'next/link';

export default function PostItem(post: PostMetaData) {
  return (
    <Link
      className="post_link group mb-8 block justify-between last:mb-0 sm:mb-10 sm:flex"
      href={'/posts/' + post.slug}
    >
      <div className="mb-1 shrink-0  font-mono text-xs text-gray-400 sm:mb-0 sm:mr-4 sm:text-base">
        {post.dateAmericaStyle}
      </div>
      <div className="flex-1">
        <h2 className="font-bold sm:group-hover:underline">{post.title}</h2>
        {post.summary && <p className="mt-1 text-sm">{post.summary}</p>}
      </div>
    </Link>
  );
}
