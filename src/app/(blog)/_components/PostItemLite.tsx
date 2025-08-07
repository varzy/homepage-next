import { PostMeta } from '@/app/(blog)/_lib/content-loader';
import Link from 'next/link';

export default function PostItem(post: PostMeta) {
  return (
    <Link className=" group mb-2 block last:mb-0" href={'/posts/' + post.slug}>
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800 group-hover:underline">{post.title}</h2>
        <div className="ml-4 shrink-0 text-sm text-gray-400">{post.dateAmericaStyle}</div>
      </div>
    </Link>
  );
}
