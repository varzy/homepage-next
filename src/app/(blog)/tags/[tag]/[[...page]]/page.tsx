import { notFound } from 'next/navigation';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import PostsContainer from '@/app/(blog)/_components/PostsContainer';
import { getAllPosts, getPostsByTag, getAllTags } from '@/app/_lib/blog-loader';
import { buildTagPageParams } from '@/app/_lib/pagination-utils';
import { SITE_CONFIG } from '@/site.config';
import { safeDecodeTag } from '@/utils/url';

export async function generateStaticParams() {
  const [allPosts, allTags] = await Promise.all([getAllPosts(), getAllTags()]);
  return buildTagPageParams(allPosts, allTags, SITE_CONFIG.blogPerPage);
}

export default async function Tag({
  params,
}: {
  params: Promise<{ tag: string; page?: string[] }>;
}) {
  const { tag, page: optionalPageParam = [] } = await params;

  if (optionalPageParam.length > 1) notFound();

  const tagText = safeDecodeTag(tag);

  const [optionalPage] = optionalPageParam;
  const currentPage = +(optionalPage || 1);

  const allPosts = await getPostsByTag(tagText);

  return (
    <BlogPageContainer pageHero={{ title: '#' + tagText }}>
      <PostsContainer posts={allPosts} currentPage={currentPage} urlPrefix={`/tags/${tag}`} />
    </BlogPageContainer>
  );
}
