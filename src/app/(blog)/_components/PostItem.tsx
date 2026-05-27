import Link from "next/link";
import { PostMeta } from "@/app/_lib/blog-loader";
import { SITE_CONFIG } from "@/site.config";

function getCategoryMeta(notionField: string) {
  const matched = Object.entries(SITE_CONFIG.categories).find(
    ([, category]) => category.notionField === notionField,
  );

  if (!matched) return null;

  const [key, category] = matched;
  return { key, alias: category.alias };
}

export default function PostItem({
  showCategory = true,
  ...post
}: PostMeta & { showCategory?: boolean }) {
  const categoryMeta = showCategory ? getCategoryMeta(post.category) : null;

  return (
    <div className="mb-8 last:mb-0 sm:mb-10">
      <div className="text-secondary text-xs sm:text-sm">
        {post.dateAmericaStyle}
        {showCategory && categoryMeta && (
          <>
            <span>. In </span>
            <Link
              className="hover:underline text-ink"
              href={`/categories/${categoryMeta.key}`}
            >
              {categoryMeta.alias}
            </Link>
          </>
        )}
      </div>
      <h2 className="text-ink py-1.5 text-base font-extrabold sm:py-2 sm:text-lg">
        <Link className="hover:underline" href={"/posts/" + post.slug}>
          {post.title}
        </Link>
      </h2>
      {post.summary && (
        <p className="text-muted text-sm sm:text-base">{post.summary}</p>
      )}
    </div>
  );
}
