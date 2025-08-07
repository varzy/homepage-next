import Link from 'next/link';

export default function PostTag({ tag }: { tag: string }) {
  return (
    <Link href={`/tags/${tag}`} className="mr-2 text-sm last:mr-0">
      <span>#{tag}</span>
    </Link>
  );
}
