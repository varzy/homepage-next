import Link from 'next/link';

export default function PostTag({ tag }: { tag: string }) {
  return (
    <Link href={`/tags/${tag}`} className="inline-block rounded-2xl px-2 py-1 border mr-2 last:mr-0">
      #{tag}
    </Link>
  );
}
