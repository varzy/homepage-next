/**
 * Cloudflare Image Transformations URL 改写工具。
 *
 * 源真相（Notion / content markdown）始终保存原始 cdn.varzy.me 链接；
 * 本工具仅在渲染层把 cdn 图片改写为 /cdn-cgi/image/<opts>/<path> 变换 URL，
 * 实现格式协商(format=auto)、质量压缩(quality=80)与 srcset 多分辨率。
 *
 * 非 cdn.varzy.me 的外链图原样透传，不做任何改写。
 *
 * 与 scripts/r2-uploader.ts 的 R2_HOST 保持一致；该脚本依赖 AWS SDK，
 * 不能被前端引用，故在此镜像常量。
 */

const CDN_HOST = 'cdn.varzy.me';

/** srcset 宽度阶梯：移动端小图、桌面端大图 */
const WIDTH_LADDER = [640, 1024, 1920] as const;

/** 正文列宽上限 ~768px */
export const CONTENT_SIZES = '(max-width: 768px) 100vw, 768px';

/** taste 卡片封面（网格内的小图） */
export const CARD_SIZES = '(max-width: 768px) 50vw, 240px';

/** 变换默认参数：质量 80、按 Accept 协商 avif/webp、剥离 metadata */
const OPTS = 'quality=80,format=auto,metadata=none';

/** 是否为自家 CDN 图片（仅对 cdn.varzy.me 改写） */
export function isCdnImage(url: string): boolean {
  try {
    return new URL(url).host === CDN_HOST;
  } catch {
    return false;
  }
}

/**
 * 拼单条变换 URL。非 CDN 图或解析失败时原样返回。
 * pathname 保留百分编码（markdown 中的 %20 等会原样带进变换 URL）。
 */
export function transformImageUrl(url: string, width?: number): string {
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

/**
 * srcset：每档宽度一条变换 URL。仅对 CDN 图返回，否则 undefined。
 */
export function buildImageSrcset(url: string): string | undefined {
  if (!isCdnImage(url)) return undefined;
  return WIDTH_LADDER.map((w) => `${transformImageUrl(url, w)} ${w}w`).join(', ');
}

export interface ImageAttrs {
  src: string;
  srcSet?: string;
  sizes?: string;
}

/**
 * 便捷聚合：返回给 <img> 的 src / srcSet / sizes。
 * 非 CDN 图只返回原始 src（不附带 srcset/sizes）。
 */
export function getImageAttrs(url: string, sizes: string = CONTENT_SIZES): ImageAttrs {
  if (!isCdnImage(url)) return { src: url };
  return {
    // 回退 src 取阶梯中档，保证不支持 srcset 的浏览器也拿到合理尺寸
    src: transformImageUrl(url, 1024),
    srcSet: buildImageSrcset(url),
    sizes,
  };
}
