import { PostMeta } from '@/app/(blog)/_lib/content-loader';
import Link from 'next/link';

export default function PostItem(post: PostMeta) {
  return (
    <div className="mb-3 block last:mb-0">
      <div className="flex flex-col sm:flex-row gap-1 sm:gap-6">
        <div className="shrink-0 text-sm text-gray-400">{post.dateAmericaStyle}</div>
        <h2 className="font-bold text-gray-800">
          <Link href={'/posts/' + post.slug} className="hover:underline">
            {post.title}
          </Link>
        </h2>
      </div>
    </div>
  );
}
