import Link from 'next/link';

export default function PostTag({ tag, count }: { tag: string; count?: number }) {
  return (
    <Link
      href={`/tags/${tag}`}
      className="me-2 inline-block rounded bg-[#e9e8ed] px-2 py-0.5 text-sm transition-all duration-300 ease-in-out last:me-0 hover:bg-[#dfdee2]"
    >
      <span>#{tag}</span>
      {count && <span className="ms-1.5">&nbsp;{count}</span>}
    </Link>
  );
}
