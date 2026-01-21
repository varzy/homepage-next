import Link from 'next/link';
import { PostMeta } from '@/app/_lib/content-loader';

export default function PostItem(post: PostMeta) {
  return (
    <div className="mb-8 last:mb-0 sm:mb-10">
      <div className="text-secondary text-xs sm:text-sm">{post.dateAmericaStyle}</div>
      <h2 className="py-1.5 text-base font-extrabold text-black sm:py-2 sm:text-lg">
        <Link className="hover:underline" href={'/posts/' + post.slug}>
          {post.title}
        </Link>
      </h2>
      {post.summary && <p className="text-sm text-gray-700 sm:text-base">{post.summary}</p>}
    </div>
  );
}
