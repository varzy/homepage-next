import Link from 'next/link';

export default function PostTag({ tag }: { tag: string }) {
  return (
    <Link href={`/tags/${tag}`} className="me-2 last:me-0">
      <span>#{tag}</span>
    </Link>
  );
}
