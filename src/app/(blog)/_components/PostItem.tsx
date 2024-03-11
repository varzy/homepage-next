import { PostMetaData } from '@/app/(blog)/_lib/notion-handler';
import Link from 'next/link';

export default function PostItem(post: PostMetaData) {
  return (
    <Link className="post_link flex justify-between rounded py-5" href={'/posts/' + post.slug}>
      <div className="flex flex-shrink-0 basis-1/6">{post.dateAmericaStyle}</div>
      <div className="ml-2 flex-1">
        <h2 className="font-bold">{post.title}</h2>
        <p className="mt-2 text-sm">{post.summary}</p>
      </div>
    </Link>
  );
}
