import Link from 'next/link';
import { PostMeta } from '@/app/_lib/content-loader';

export default function PostItem(post: PostMeta) {
  return (
    <div className="mb-3 block last:mb-0">
      <div className="flex gap-3">
        <h2 className="flex-1 leading-6 text-black">
          <Link href={'/posts/' + post.slug} className="hover:underline">
            {post.title}
          </Link>
        </h2>
        <div className="text-secondary shrink-0 text-sm leading-6">{post.dateAmericaStyle}</div>
      </div>
    </div>
  );
}
