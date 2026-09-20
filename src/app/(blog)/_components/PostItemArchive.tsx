import Link from 'next/link';
import { type PostMeta as PostMetaData } from '@/app/_lib/post-loader';
import PostMeta from './PostMeta';

export default function PostItem(post: PostMetaData) {
  return (
    <article className="mb-3 block last:mb-0">
      <div className="flex gap-3">
        <h3 className="text-ink flex-1 leading-6">
          <Link href={'/posts/' + post.slug} className="hover:underline">
            {post.title}
          </Link>
        </h3>
        <PostMeta post={post} showCategory={false} showTags={false} dateTpl="MMM DD"></PostMeta>
      </div>
    </article>
  );
}
