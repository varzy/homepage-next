import Link from 'next/link';
import { PostMeta } from '@/app/_lib/post-loader';

export default function NextPost({ nextPost }: { nextPost: PostMeta | null }) {
  return (
    nextPost && (
      <nav className="mt-14" aria-label="下一篇">
        <div>
          <p className="text-secondary text-sm">下一篇</p>
          <h2 className="text-ink py-2 font-extrabold">
            <Link className="hover:underline" href={'/posts/' + nextPost.slug}>
              {nextPost.title}
            </Link>
          </h2>
          {nextPost.summary && <p className="text-muted text-sm">{nextPost.summary}</p>}
        </div>
      </nav>
    )
  );
}
