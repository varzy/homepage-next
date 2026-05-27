import { notFound } from 'next/navigation';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import PostsContainer from '@/app/(blog)/_components/PostsContainer';
import { getCategoryPosts } from '@/app/_lib/blog-loader';
import { SITE_CONFIG, isCategoryKey } from '@/site.config';

export async function generateStaticParams() {
  const categoriesConfig = SITE_CONFIG.categories;

  const renderingGroups = await Promise.all(
    Object.keys(categoriesConfig).map(async (key) => {
      const categoryField = categoriesConfig[key as keyof typeof categoriesConfig].notionField;
      const categoryPosts = await getCategoryPosts(categoryField);

      if (categoryPosts.length === 0) return [];

      const totalPages = Math.ceil(categoryPosts.length / SITE_CONFIG.blogPerPage);
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
  const { category: categoryParam, page: optionalPageParam = [] } = await params;
  if (optionalPageParam.length > 1) notFound();

  const [optionalPage] = optionalPageParam;
  const currentPage = +(optionalPage || 1);
  if (!isCategoryKey(categoryParam)) notFound();
  const categoryCtx = SITE_CONFIG.categories[categoryParam];
  const categoryField = categoryCtx.notionField;
  const allPosts = await getCategoryPosts(categoryField);

  return (
    <BlogPageContainer pageHero={{ title: categoryCtx.alias, after: categoryCtx.description }}>
      <PostsContainer
        posts={allPosts}
        currentPage={currentPage}
        showCategory={false}
        urlPrefix={`/categories/${categoryParam}`}
      />
    </BlogPageContainer>
  );
}
