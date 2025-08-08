import { PostMeta } from '@/app/(blog)/_lib/content-loader';
import Link from 'next/link';

export default function PostItem(post: PostMeta) {
  return (
    <div className="mb-3 block last:mb-0">
      <div className="flex gap-3">
        <h2 className="flex-1 leading-6 text-black">
          <Link href={'/posts/' + post.slug} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        <div className="shrink-0 text-sm leading-6 text-gray-500">{post.dateAmericaStyle}</div>
      </div>
    </div>
  );
}
