import { PostMeta } from '@/app/(blog)/_lib/content-loader';
import Link from 'next/link';

export default function PostItem(post: PostMeta) {
  return (
    <div className="mb-10">
      <div className="text-sm text-gray-500">{post.dateAmericaStyle}</div>
      <h2 className="py-1 text-lg font-extrabold text-black">
        <Link className="hover:underline" href={'/posts/' + post.slug}>
          {post.title}
        </Link>
      </h2>
      {post.summary && <p className="text-gray-700">{post.summary}</p>}
    </div>
  );
}
