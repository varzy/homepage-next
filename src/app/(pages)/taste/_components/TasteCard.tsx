import type { TasteItemWithContent } from '@/app/_lib/taste-loader';
import { getImageAttrs, CARD_SIZES } from '@/utils/image-transform';

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
  const cover = item.cover ? getImageAttrs(item.cover, CARD_SIZES) : null;
  const inner = (
    <article className="text-sm">
      {/* cover */}
      {cover && (
        <div className="mb-2 overflow-hidden" style={aspectStyle}>
          <img
            src={cover.src}
            srcSet={cover.srcSet}
            sizes={cover.sizes}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="">
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
      </div>
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
