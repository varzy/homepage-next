const CDN_HOST = 'cdn.varzy.me';
// tailwind sm, lg, 2xl
const WIDTH_LADDER = [640, 1024, 1536] as const;
// 内容区域宽度为 720px，小于则
const DEFAULT_SIZES = '(max-width: 720px) 100vw, 720px';
/** 变换默认参数：质量 80、按 Accept 协商 avif/webp、剥离 metadata、失败时自动回到原始图片 */
const OPTS = 'quality=80,format=auto,metadata=none,onerror=redirect';

/** 是否为自家 CDN 图片（仅对 cdn.varzy.me 改写） */
function isCdnImage(url: string): boolean {
  try {
    return new URL(url).host === CDN_HOST;
  } catch {
    return false;
  }
}

function transformImageUrl(url: string, width?: number): string {
  try {
    const u = new URL(url);
    if (u.host !== CDN_HOST) return url;
    const path = u.pathname.replace(/^\//, '');
    const opts = width ? `width=${width},${OPTS}` : OPTS;
    return `https://${CDN_HOST}/cdn-cgi/image/${opts}/${path}`;
  } catch {
    return url;
  }
}

/** srcset：每档宽度一条变换 URL。仅对 CDN 图返回，否则 undefined。 */
function buildImageSrcset(url: string): string | undefined {
  if (!isCdnImage(url)) return undefined;
  return WIDTH_LADDER.map((w) => `${transformImageUrl(url, w)} ${w}w`).join(', ');
}

interface ImageSetProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  sizes?: string;
}

export default function ImageSet({ src, sizes, ...rest }: ImageSetProps) {
  const finalSizes = sizes ?? DEFAULT_SIZES;
  // 非 CDN 图只返回原始 src（不附带 srcset/sizes）
  const imgProps = isCdnImage(src)
    ? {
        src: transformImageUrl(src, 1024),
        srcSet: buildImageSrcset(src),
        sizes: finalSizes,
      }
    : { src };

  return <img {...rest} {...imgProps} />;
}
