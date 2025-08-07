import Link from 'next/link';

export default function PostTag({ tag, count }: { tag: string; count?: number }) {
  return (
    <Link
      href={`/tags/${tag}`}
      className="mr-2 inline-block rounded bg-[#e9e8ed] px-3 py-0.5 text-sm transition-all duration-300 last:mr-0 hover:bg-[#dfdee2]"
    >
      <span>#{tag}</span>
      {count && <span className="ml-2">&nbsp;{count}</span>}
    </Link>
  );
}
