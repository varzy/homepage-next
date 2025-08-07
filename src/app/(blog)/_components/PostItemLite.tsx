import { PostMeta } from '@/app/(blog)/_lib/content-loader';
import Link from 'next/link';

export default function PostItem(post: PostMeta) {
  return (
    <div className="mb-3 block last:mb-0">
      <div className="flex justify-between gap-4">
        <h2 className="text-black">
          <Link href={'/posts/' + post.slug} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        <div className="shrink-0 text-sm text-gray-500">{post.dateAmericaStyle}</div>
      </div>
    </div>
  );
}
