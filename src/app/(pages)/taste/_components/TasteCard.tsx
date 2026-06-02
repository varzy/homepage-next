import MdxRenderer from '@/app/_components/MdxRenderer';
import type { TasteItemWithContent } from '@/app/_lib/taste-loader';

export default function TasteCard({ item }: { item: TasteItemWithContent }) {
  const inner = (
    <div className="bg-white p-2">
      {item.cover && (
        <div className="mb-2 aspect-3/4 overflow-hidden">
          <img src={item.cover} alt={item.title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="text-sm font-medium">{item.title}</div>
      {item.label && <div className="text-secondary mt-0.5 text-xs">{item.label}</div>}
      {item.content && (
        <div className="text-secondary mt-1 text-xs">
          <MdxRenderer source={item.content} />
        </div>
      )}
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
