import { PostMetaData } from '@/app/(blog)/_lib/notion-handler';
import Link from 'next/link';

export default function PostItem(post: PostMetaData) {
  return (
    <Link className="post_link block rounded px-4 py-4 transition hover:bg-gray-100" href={'/posts/' + post.slug}>
      <p className="text-xs">{post.dateAmericaStyle}</p>
      <h2 className="mt-2 font-bold">{post.title}</h2>
      <p className="mt-2">{post.summary}</p>
    </Link>
  );
}
