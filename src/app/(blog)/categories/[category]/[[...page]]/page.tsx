import { SITE_CONFIG } from '@/site.config';
import { notFound } from 'next/navigation';
import { getAllPosts, getPostsByCategory } from '@/app/_lib/content-loader';
import PostsContainer from '@/app/(blog)/_components/PostsContainer';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';

export async function generateStaticParams() {
  const categoriesConfig = SITE_CONFIG.categories;
  const allPosts = await getAllPosts();

  const renderingGroups = Object.keys(categoriesConfig).map((key) => {
    const categoryField = categoriesConfig[key as keyof typeof categoriesConfig].notionField;
    const categoryPosts = allPosts.filter((post) => post.category === categoryField);

    if (categoryPosts.length === 0) return [];

    const totalPages = Math.ceil(categoryPosts.length / SITE_CONFIG.blogPerPage);
    return Array.from({ length: totalPages }).map((_, i) => ({
      category: key,
      page: [String(i + 1)],
    }));
  });

  return renderingGroups.reduce((all, group) => [...all, ...group], []);
}

export default async function Page({
  params,
}: {
  params: Promise<{ category: keyof typeof SITE_CONFIG.categories; page?: string[] }>;
}) {
  const { category: categoryParam, page: optionalPageParam = [] } = await params;
  if (optionalPageParam.length > 1) notFound();

  // 页码
  const [optionalPage] = optionalPageParam;
  const currentPage = +(optionalPage || 1);

  // 类别
  const categoryCtx = SITE_CONFIG.categories[categoryParam];
  const categoryField = categoryCtx.notionField;

  // 获取当前类别下全部文章
  const allPosts = await getPostsByCategory(categoryField);

  return (
    <BlogPageContainer pageHero={{ title: categoryCtx.alias, after: categoryCtx.description }}>
      <PostsContainer posts={allPosts} currentPage={currentPage} urlPrefix={`/categories/${categoryParam}`} />
    </BlogPageContainer>
  );
}
