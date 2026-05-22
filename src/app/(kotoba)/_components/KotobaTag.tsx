import Link from 'next/link';

export default function KotobaTag({
  tag,
  count,
  active,
}: {
  tag: string;
  count?: number;
  active?: boolean;
}) {
  return (
    <Link
      href={`/kotoba/tag/${encodeURIComponent(tag)}`}
      className={`me-2 inline-block rounded px-2 py-0.5 text-sm transition-all duration-300 ease-in-out last:me-0 hover:bg-[#dfdee2] ${active ? 'bg-[#dfdee2] font-medium' : 'bg-[#e9e8ed]'}`}
    >
      <span>#{tag}</span>
      {count !== undefined && <span className="text-secondary ms-1.5">&nbsp;{count}</span>}
    </Link>
  );
}
