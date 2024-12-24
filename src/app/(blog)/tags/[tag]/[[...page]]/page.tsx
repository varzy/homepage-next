import { SITE_CONFIG } from '@/site.config';
import { notFound } from 'next/navigation';
import { composeDatabaseQuery, getAllPagesWithMeta, getDatabaseTags } from '@/app/(blog)/_lib/notion-handler';
import PostsContainer from '@/app/(blog)/_components/PostsContainer';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';

export async function generateStaticParams() {
  const tags = await getDatabaseTags(composeDatabaseQuery());
  const allPosts = await getAllPagesWithMeta(composeDatabaseQuery());
  const renderingGroups = tags.map((tag) => {
    const tagPosts = allPosts.filter((post) => post.tags.includes(tag));
    if (tagPosts.length === 0) return [];
    const totalPages = Math.ceil(tagPosts.length / SITE_CONFIG.blogPerPage);
    return Array.from({ length: totalPages }).map((_, i) => ({ tag, page: [i + 1 + ''] }));
  });
  return renderingGroups.reduce((all, group) => [...all, ...group], []);
}

export default async function Tag({ params }: { params: { tag: string; page?: string[] } }) {
  const { tag, page: optionalPageParam = [] } = params;

  if (optionalPageParam.length > 1) notFound();
  const tagText = decodeURIComponent(tag);
  const [optionalPage] = optionalPageParam;
  const currentPage = +(optionalPage || 1);

  const allPosts = await getAllPagesWithMeta(
    composeDatabaseQuery({
      filter: {
        and: [{ property: 'tags', multi_select: { contains: tagText } }],
      },
    }),
  );

  return (
    <BlogPageContainer pageHero={{ title: '#' + decodeURIComponent(tagText) }}>
      <PostsContainer posts={allPosts} currentPage={currentPage} urlPrefix={`/tags/${tagText}`}></PostsContainer>
    </BlogPageContainer>
  );
}
