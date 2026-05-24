import LightboxImage from '@/app/_components/LightboxImage';

interface KotobaImageGridProps {
  images: string[];
}

export default function KotobaImageGrid({ images }: KotobaImageGridProps) {
  if (images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="mt-3">
        <LightboxImage
          src={images[0]}
          alt=""
          className="max-h-96 w-full object-cover"
          wrapperClassName="block w-full"
        />
      </div>
    );
  }

  const gridCols = images.length === 2 ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className={`mt-3 grid ${gridCols} gap-1`}>
      {images.map((src, i) => (
        <LightboxImage
          key={i}
          src={src}
          alt=""
          className="h-full w-full object-cover"
          wrapperClassName="aspect-square overflow-hidden"
        />
      ))}
    </div>
  );
}
