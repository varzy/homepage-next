import ImageSet from '@/app/_components/ImageSet';
import type { TasteItemWithContent } from '@/app/_lib/taste-loader';

export default function TasteCard({
  item,
  aspect = 3 / 4,
  showExtra = false,
}: {
  item: TasteItemWithContent;
  aspect?: number;
  showExtra?: boolean;
}) {
  const aspectStyle = { aspectRatio: aspect };
  const inner = (
    <article className="text-sm">
      {/* cover */}
      {item.cover && (
        <div className="mb-2 overflow-hidden" style={aspectStyle}>
          <ImageSet
            src={item.cover}
            sizes="(max-width: 720px) 50vw, 240px"
            alt={item.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      {/* title */}
      <h3 className="m-0 text-sm font-bold">
        <span>{item.title}</span>
        {showExtra && item.alias && (
          <span className="text-secondary font-extralight"> ({item.alias})</span>
        )}
      </h3>
      {/* label */}
      {item.label && <div className="text-muted mt-1.5 text-xs">{item.label}</div>}
      {/* content */}
      {showExtra && item.content && <p className="mt-1.5 text-xs">{item.content}</p>}
    </article>
  );

  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }

  return inner;
}
