'use client';

import clsx from 'clsx';
import ImageSet from './ImageSet';
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

  // 放大图始终用原始全尺寸 src（不压缩）；srcset 渲染与错误兜底交由 ImageSet
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={() => open(src)}
      className={wrapperClassName ?? 'contents'}
      aria-label={alt || 'View image'}
    >
      <ImageSet {...rest} src={src} alt={alt} className={clsx(className, 'cursor-zoom-in')} />
    </button>
  );
}
