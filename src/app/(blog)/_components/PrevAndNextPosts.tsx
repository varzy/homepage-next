import Link from 'next/link';
import { PostMeta } from '@/app/_lib/content-loader';
import clsx from 'clsx';

export default function PrevAndNextPosts({
  prevPost,
  nextPost,
}: {
  prevPost: PostMeta | null;
  nextPost: PostMeta | null;
}) {
  const posts = [prevPost, nextPost];

  return (
    <div className="mt-12 flex justify-between gap-3">
      {posts.map((post, index) => (
        <div className="flex-1" key={index}>
          <div className={clsx(index === 1 && 'text-right')}>
            {post && (
              <div>
                <p className="text-secondary text-sm">{index === 0 ? '上一篇' : '下一篇'}</p>
                <p className="mt-1">
                  <Link className="hover:underline" href={post.slug}>
                    {post.title}
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
