import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import PostsContainer from '@/app/(blog)/_components/PostsContainer';
import { buildPageSegments } from '@/app/_lib/pagination-utils';
import { getCategoryPosts } from '@/app/_lib/post-loader';
import { SITE_CONFIG, isCategoryKey } from '@/site.config';
import { getEmojiFavicon } from '@/utils/favicon';

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
  const groups = await Promise.all(
    Object.keys(SITE_CONFIG.categories).map(async (key) => {
      const posts = await getCategoryPosts(key);
      return buildPageSegments(posts.length, SITE_CONFIG.blogPerPage).map((page) => ({
        category: key,
        page,
      }));
    }),
  );
  return groups.flat();
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
  const allPosts = await getCategoryPosts(categoryParam);

  return (
    <BlogPageContainer pageHero={{ title: categoryCtx.alias, after: categoryCtx.description }}>
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
