import { SITE_CONFIG } from '@/site.config';
import { notFound } from 'next/navigation';
import { composeDatabaseQuery, getAllPagesWithMeta } from '@/app/(blog)/_lib/notion-handler';
import PostsContainer from '@/app/(blog)/_components/PostsContainer';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';

export async function generateStaticParams() {
  const categoriesConfig = SITE_CONFIG.categories;
  const presetCategories = Object.keys(categoriesConfig).map((key) => ({
    routeParam: key,
    filed: categoriesConfig[key as keyof typeof categoriesConfig].notionField,
  }));

  const allPosts = await getAllPagesWithMeta(
    composeDatabaseQuery({
      filter: {
        and: [
          {
            or: presetCategories.map((category) => ({
              property: 'category',
              select: { equals: category.filed },
            })),
          },
        ],
      },
    }),
  );

  const renderingGroups = presetCategories.map((category) => {
    const categoryPosts = allPosts.filter((post) => post.category === category.filed);
    if (categoryPosts.length === 0) return [];
    const totalPages = Math.ceil(categoryPosts.length / SITE_CONFIG.blogPerPage);
    return Array.from({ length: totalPages }).map((_, i) => ({ category: category.routeParam, page: [i + 1 + ''] }));
  });
  return renderingGroups.reduce((all, group) => [...all, ...group], []);
}

export default async function Page({
  params,
}: {
  params: { category: keyof typeof SITE_CONFIG.categories; page?: string[] };
}) {
  const { category: categoryParam, page: optionalPageParam = [] } = params;
  if (optionalPageParam.length > 1) notFound();
  // 页码
  const [optionalPage] = optionalPageParam;
  const currentPage = +(optionalPage || 1);
  // 类别
  const categoryCtx = SITE_CONFIG.categories[categoryParam];
  const categoryField = categoryCtx.notionField;
  // 获取当前类别下全部文章
  const allPosts = await getAllPagesWithMeta(
    composeDatabaseQuery({
      filter: {
        and: [{ property: 'category', select: { equals: categoryField } }],
      },
    }),
  );

  return (
    <BlogPageContainer pageHero={{ title: categoryCtx.alias, after: categoryCtx.description }}>
      <PostsContainer
        posts={allPosts}
        currentPage={currentPage}
        urlPrefix={`/categories/${categoryParam}`}
      ></PostsContainer>
    </BlogPageContainer>
  );
}
