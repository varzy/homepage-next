import { PostMetaData } from '@/lib/notion/notion-handler';
import Link from 'next/link';

export default function PostItem(post: PostMetaData) {
  return (
    <Link className="post_link block hover:bg-gray-100 p-4 rounded transition" href={'/' + post.slug}>
      <div className="flex">
        <div className="flex-shrink-0 align-right">{post.date}</div>
        <div className="flex-1 ml-4">
          <h2 className="font-bold">{post.title}</h2>
          <p className="">{post.summary}</p>
        </div>
      </div>
    </Link>
  );
}
