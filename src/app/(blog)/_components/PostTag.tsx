import Link from 'next/link';

export default function PostTag({ tag, count }: { tag: string; count?: number }) {
  return (
    <Link
      href={`/tags/${tag}`}
      className="mr-2 inline-block rounded-2xl border px-3 py-0.5 text-sm transition last:mr-0 hover:bg-gray-200"
    >
      <span>#{tag}</span>
      {count && <span className="ml-2">&nbsp;{count}</span>}
    </Link>
  );
}
