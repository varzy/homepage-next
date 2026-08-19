'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { getImageAttrs } from '@/utils/image-transform';
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
  // 变换 URL 出错（如配额超限返回 9422）时回退到原始图，避免白图。
  const [fallback, setFallback] = useState(false);

  if (typeof src !== 'string' || !src) {
    return <img src={src} alt={alt} className={className} {...rest} />;
  }

  const attrs = getImageAttrs(src);
  const displaySrc = fallback ? src : attrs.src;

  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => open(src)}
      className={wrapperClassName ?? 'contents'}
      aria-label={alt || 'View image'}
    >
      <img
        {...rest}
        src={displaySrc}
        alt={alt}
        srcSet={fallback ? undefined : attrs.srcSet}
        sizes={attrs.sizes}
        loading={rest.loading ?? 'lazy'}
        onError={() => setFallback(true)}
        className={clsx(className, 'cursor-zoom-in')}
      />
    </button>
  );
}
