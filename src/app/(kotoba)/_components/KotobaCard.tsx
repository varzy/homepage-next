import Link from "next/link";
import { MDXRemote } from "next-mdx-remote/rsc";
import { KotobaPostWithContent } from "@/app/_lib/content-loader";
import { extractImagesFromMdx, formatRelativeTime } from "../_lib/kotoba-utils";
import KotobaImageGrid from "./KotobaImageGrid";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CardLink = (props: any) => (
  <a target="_blank" rel="noopener noreferrer" {...props} />
);

interface KotobaCardProps {
  post: KotobaPostWithContent;
}

export default function KotobaCard({ post }: KotobaCardProps) {
  const { images, cleanContent } = extractImagesFromMdx(post.content);
  const hasContent = cleanContent.length > 0;
  const relativeTime = formatRelativeTime(post.publishedDate);

  return (
    <article className="mb-10 last:mb-0 sm:mb-12">
      <div className="mb-3 flex flex-wrap items-baseline gap-x-3 text-xs">
        {relativeTime && <span className="text-secondary">{relativeTime}</span>}
        <time dateTime={post.publishedDate} className="text-secondary/60">
          {post.publishedDate}
        </time>
      </div>

      {post.withTitle && post.title && (
        <div className="py-1.5 font-bold text-black sm:py-2">
          {post.titleUrl ? (
            <a
              href={post.titleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {post.title}
            </a>
          ) : (
            post.title
          )}
        </div>
      )}

      {hasContent && (
        <div className="prose prose-sm prose-code:before:content-none prose-code:after:content-none prose-a:font-normal prose-a:text-inherit prose-a:decoration-1 prose-blockquote:[&_p]:before:content-none prose-blockquote:[&_p]:after:content-none max-w-none leading-relaxed wrap-break-word">
          <MDXRemote source={cleanContent} components={{ a: CardLink }} />
        </div>
      )}

      <KotobaImageGrid images={images} />

      {post.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {post.tags.map((tag) => (
            <Link
              key={tag}
              href={`/kotoba/tags/${encodeURIComponent(tag)}`}
              className="text-secondary hover:text-black"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
