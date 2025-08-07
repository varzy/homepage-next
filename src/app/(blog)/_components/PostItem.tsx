import { PostMeta } from '@/app/(blog)/_lib/content-loader';
import Link from 'next/link';

export default function PostItem(post: PostMeta) {
  return (
    <div className="mb-12 block">
      <div className="block sm:flex sm:items-center sm:justify-between">
        <div className="text-sm text-gray-400 sm:hidden">{post.dateAmericaStyle}</div>
        <h2 className="text-lg font-bold text-gray-800">
          <Link href={'/posts/' + post.slug}>{post.title}</Link>
        </h2>
        <div className="ml-4 hidden shrink-0 text-sm text-gray-400 sm:block">{post.dateAmericaStyle}</div>
      </div>
      {post.summary && <p className="mt-1 text-sm text-gray-500">{post.summary}</p>}
    </div>
  );
}
