import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import PostsContainer from '@/app/(blog)/_components/PostsContainer';
import { buildIndexPageParams } from '@/app/_lib/pagination-utils';
import { getAllPosts } from '@/app/_lib/post-loader';
import { SITE_CONFIG } from '@/site.config';
import { getEmojiFavicon } from '@/utils/favicon';

export const metadata: Metadata = {
  title: 'Articles',
  icons: getEmojiFavicon('✏️'),
};

export async function generateStaticParams() {
  const allPosts = await getAllPosts();
  return buildIndexPageParams(allPosts.length, SITE_CONFIG.blogPerPage);
}

export default async function BlogPage({ params }: { params: Promise<{ page?: string[] }> }) {
  const { page: optionalPageParam = [] } = await params;
  if (optionalPageParam.length > 1) notFound();

  const [optionalPage] = optionalPageParam;
  const currentPage = +(optionalPage || 1);
  const allPosts = await getAllPosts();

  return (
    <BlogPageContainer pageHero={{ title: 'Articles' }}>
      <PostsContainer
        posts={allPosts}
        currentPage={currentPage}
        showTags={false}
        urlPrefix="/blog"
      />
    </BlogPageContainer>
  );
}
