import Link from 'next/link';

export default function PostTag({ tag, count }: { tag: string; count?: number }) {
  return (
    // <Link
    //   href={`/tags/${tag}`}
    //   className="bg-tag hover:bg-tag-hover me-2 inline-block rounded px-2 py-0.5 text-sm transition-all duration-300 ease-in-out last:me-0"
    // >
    //   <span>#{tag}</span>
    //   {count && <span className="text-secondary ms-1.5">&nbsp;{count}</span>}
    // </Link>
    <Link href={`/tags/${tag}`} className="me-3 text-sm last:me-0 hover:underline">
      <span>#{tag}</span>
      {count && <span className="text-secondary"> {count}</span>}
    </Link>
  );
}
