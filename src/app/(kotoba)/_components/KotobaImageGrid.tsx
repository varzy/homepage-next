interface KotobaImageGridProps {
  images: string[];
}

export default function KotobaImageGrid({ images }: KotobaImageGridProps) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="mt-3">
        <img
          src={images[0]}
          alt=""
          className="max-h-96 w-full rounded-lg object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  const gridCols = images.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className={`mt-3 grid ${gridCols} gap-1 overflow-hidden rounded-lg`}>
      {images.map((src, i) => (
        <div key={i} className="aspect-square overflow-hidden">
          <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
      ))}
    </div>
  );
}
