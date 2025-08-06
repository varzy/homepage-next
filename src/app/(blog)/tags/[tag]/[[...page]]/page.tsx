import { SITE_CONFIG } from '@/site.config';
import { notFound } from 'next/navigation';
import { getAllPosts, getPostsByTag, getAllTags } from '@/app/(blog)/_lib/content-loader';
import PostsContainer from '@/app/(blog)/_components/PostsContainer';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';

export async function generateStaticParams() {
  const tags = await getAllTags();
  const allPosts = await getAllPosts();

  const renderingGroups = tags.map((tag) => {
    const tagPosts = allPosts.filter((post) => post.tags.includes(tag));
    if (tagPosts.length === 0) return [];

    const totalPages = Math.ceil(tagPosts.length / SITE_CONFIG.blogPerPage);
    return Array.from({ length: totalPages }).map((_, i) => ({
      tag: encodeURIComponent(tag),
      page: [String(i + 1)],
    }));
  });

  return renderingGroups.reduce((all, group) => [...all, ...group], []);
}

export default async function Tag({ params }: { params: Promise<{ tag: string; page?: string[] }> }) {
  const { tag, page: optionalPageParam = [] } = await params;

  if (optionalPageParam.length > 1) notFound();

  const tagText = decodeURIComponent(tag);
  const [optionalPage] = optionalPageParam;
  const currentPage = +(optionalPage || 1);

  const allPosts = await getPostsByTag(tagText);

  return (
    <BlogPageContainer pageHero={{ title: '#' + tagText }}>
      <PostsContainer posts={allPosts} currentPage={currentPage} urlPrefix={`/tags/${encodeURIComponent(tagText)}`} />
    </BlogPageContainer>
  );
}
