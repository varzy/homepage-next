'use client';

import clsx from 'clsx';
import { useLightbox } from './LightboxProvider';

interface LightboxImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
}

export default function LightboxImage({
  src,
  alt,
  className,
  wrapperClassName,
  ...rest
}: LightboxImageProps) {
  const { open } = useLightbox();

  if (typeof src !== 'string' || !src) {
    return <img src={src} alt={alt} className={className} {...rest} />;
  }

  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => open(src)}
      className={wrapperClassName ?? 'contents'}
      aria-label={alt || 'View image'}
    >
      <img
        src={src}
        alt={alt}
        className={clsx(className, 'cursor-zoom-in')}
        loading={rest.loading ?? 'lazy'}
        {...rest}
      />
    </button>
  );
}
