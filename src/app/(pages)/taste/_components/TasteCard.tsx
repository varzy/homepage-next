import type { TasteItemWithContent } from '@/app/_lib/taste-loader';

export default function TasteCard({
  item,
  aspect = 3 / 4,
}: {
  item: TasteItemWithContent;
  aspect?: number;
}) {
  const aspectStyle = { aspectRatio: aspect };
  const inner = (
    <div title={item.content} className="rotate-0">
      {item.cover && (
        <div className="mb-2 overflow-hidden border-4 border-white" style={aspectStyle}>
          <img src={item.cover} alt={item.title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="text-xs">
        {/* title */}
        <div className="line-clamp-2 text-sm font-bold">
          <span>{item.title}</span>
        </div>
        {/* label */}
        {item.label && <div className="text-secondary mt-1 text-xs">{item.label}</div>}
        {/* content */}
        {item.content && <p>{item.content}</p>}
      </div>
    </div>
  );

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }

  return <div>{inner}</div>;
}
