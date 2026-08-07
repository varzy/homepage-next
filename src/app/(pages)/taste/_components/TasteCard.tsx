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
    <div>
      {item.cover && (
        <div className="mb-2 overflow-hidden border-4 border-white" style={aspectStyle}>
          <img src={item.cover} alt={item.title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="">
        {/* title */}
        <div className="text-sm font-bold">
          <span>{item.title}</span>
          {item.alias && <span className="text-muted font-light"> {item.alias}</span>}
        </div>
        {/* label */}
        {item.label && <div className="text-secondary mt-1.5 text-xs">{item.label}</div>}
        {/* content */}
        {item.content && <p className="mt-1.5 text-xs">{item.content}</p>}
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
