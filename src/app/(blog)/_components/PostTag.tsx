import Link from 'next/link';

export default function PostTag({ tag, count }: { tag: string; count?: number }) {
  return (
    <Link href={`/tags/${tag}`} className="me-3 text-sm last:me-0 hover:underline">
      <span>#{tag}</span>
      {count && <span className="text-secondary"> {count}</span>}
    </Link>
  );
}
