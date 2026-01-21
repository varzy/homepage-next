import Link from 'next/link';
import { PostMeta } from '@/app/_lib/content-loader';

export default function PrevAndNextPosts({ nextPost }: { nextPost: PostMeta | null }) {
  return (
    nextPost && (
      <div className="mt-14 flex justify-between gap-3">
        <div className="flex-1">
          <div>
            <div>
              <p className="text-secondary text-sm">下一篇</p>
              <h2 className="py-1.5 text-base font-extrabold text-black sm:py-2 sm:text-lg">
                <Link className="hover:underline" href={'/posts/' + nextPost.slug}>
                  {nextPost.title}
                </Link>
              </h2>
              {nextPost.summary && (
                <p className="text-sm text-gray-700 sm:text-base">{nextPost.summary}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  );
}
