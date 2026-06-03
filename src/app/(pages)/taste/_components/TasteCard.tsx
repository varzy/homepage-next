// import MdxRenderer from '@/app/_components/MdxRenderer';
import type { TasteItemWithContent } from '@/app/_lib/taste-loader';

export default function TasteCard({ item }: { item: TasteItemWithContent }) {
  const inner = (
    <div title={item.title}>
      {item.cover && (
        <div className="mb-2 aspect-4/5 overflow-hidden">
          <img src={item.cover} alt={item.title} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="text-xs">
        {/* title */}
        <div className="line-clamp-2 text-sm font-medium">{item.title}</div>
        {/* label */}
        {item.label && <div className="text-secondary mt-1">{item.label}</div>}
        {/* {item.content && (
        <div className="text-secondary mt-1 text-xs">
          <MdxRenderer source={item.content} />
        </div>
      )} */}
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
