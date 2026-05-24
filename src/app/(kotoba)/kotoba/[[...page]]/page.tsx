import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageHero from '@/app/(blog)/_components/PageHero';
import { getAllKotobaPosts, getAllKotobaPostsWithContent } from '@/app/_lib/content-loader';
import { getEmojiFavicon } from '@/utils/favicon';
import { SITE_CONFIG } from '@/site.config';
import KotobaContainer from '../../_components/KotobaContainer';

export const metadata: Metadata = {
  title: '言叶',
  icons: getEmojiFavicon('🍃'),
};

export async function generateStaticParams() {
  const posts = await getAllKotobaPosts();
  const totalPages = Math.max(1, Math.ceil(posts.length / SITE_CONFIG.kotobaPerPage));
  return Array.from({ length: totalPages }, (_, i) => ({ page: [String(i + 1)] }));
}

export default async function KotobaPage({ params }: { params: Promise<{ page?: string[] }> }) {
  const { page: pageParam = [] } = await params;
  if (pageParam.length > 1) notFound();

  const currentPage = +(pageParam[0] || 1);
  if (isNaN(currentPage) || currentPage < 1) notFound();

  const posts = await getAllKotobaPostsWithContent();

  return (
    <>
      <PageHero title="言叶" />
      <div className="g-container pb-20">
        <KotobaContainer posts={posts} currentPage={currentPage} urlPrefix="/kotoba" />
      </div>
    </>
  );
}
