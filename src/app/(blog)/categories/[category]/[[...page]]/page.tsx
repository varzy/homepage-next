import { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogPageContainer from "@/app/(blog)/_components/BlogPageContainer";
import PostsContainer from "@/app/(blog)/_components/PostsContainer";
import { getCategoryPosts } from "@/app/_lib/post-loader";
import { SITE_CONFIG, isCategoryKey } from "@/site.config";
import { getEmojiFavicon } from "@/utils/favicon";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  if (!isCategoryKey(category)) return {};
  const categoryCtx = SITE_CONFIG.categories[category];
  return {
    title: categoryCtx.alias,
    icons: getEmojiFavicon(categoryCtx.favicon),
  };
}

export async function generateStaticParams() {
  const categoriesConfig = SITE_CONFIG.categories;

  const renderingGroups = await Promise.all(
    Object.keys(categoriesConfig).map(async (key) => {
      const categoryPosts = await getCategoryPosts(key);

      if (categoryPosts.length === 0) return [];

      const totalPages = Math.ceil(
        categoryPosts.length / SITE_CONFIG.blogPerPage,
      );
      return Array.from({ length: totalPages }).map((_, i) => ({
        category: key,
        page: [String(i + 1)],
      }));
    }),
  );

  return renderingGroups.reduce((all, group) => [...all, ...group], []);
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string; page?: string[] }>;
}) {
  const { category: categoryParam, page: optionalPageParam = [] } =
    await params;
  if (optionalPageParam.length > 1) notFound();

  const [optionalPage] = optionalPageParam;
  const currentPage = +(optionalPage || 1);
  if (!isCategoryKey(categoryParam)) notFound();
  const categoryCtx = SITE_CONFIG.categories[categoryParam];
  const allPosts = await getCategoryPosts(categoryParam);

  return (
    <BlogPageContainer
      pageHero={{ title: categoryCtx.alias, after: categoryCtx.description }}
    >
      <PostsContainer
        posts={allPosts}
        currentPage={currentPage}
        showCategory={false}
        showTags={false}
        urlPrefix={`/categories/${categoryParam}`}
      />
    </BlogPageContainer>
  );
}
