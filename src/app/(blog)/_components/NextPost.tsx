import Link from 'next/link';
import { PostMeta } from '@/app/_lib/post-loader';

export default function NextPost({ nextPost }: { nextPost: PostMeta | null }) {
  return (
    nextPost && (
      <div className="mt-14 flex justify-between gap-3">
        <div className="flex-1">
          <div>
            <div>
              <p className="text-secondary text-sm">下一篇</p>
              <h2 className="text-ink py-1.5 text-base font-extrabold sm:py-2 sm:text-lg">
                <Link className="hover:underline" href={'/posts/' + nextPost.slug}>
                  {nextPost.title}
                </Link>
              </h2>
              {nextPost.summary && (
                <p className="text-muted text-sm sm:text-base">{nextPost.summary}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  );
}
