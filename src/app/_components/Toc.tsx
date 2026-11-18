import type { TocItem } from '@/app/_lib/rehype-toc';

export default function Toc({ items }: { items: TocItem[] }) {
  const minDepth = Math.min(...items.map((item) => item.depth));

  return (
    <nav aria-label="文章目录" className="sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
      <p className="text-secondary mb-6 text-sm">Table of Content</p>
      <ul className="space-y-2 text-sm leading-snug">
        {items.map((item) => (
          <li key={item.id} style={{ paddingLeft: `${item.depth - minDepth}em` }}>
            <a className="text-muted hover:text-ink hover:underline" href={`#${item.id}`}>
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
