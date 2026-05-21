import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageHero from '@/app/(blog)/_components/PageHero';
import { getAllKotobaPosts, getAllKotobaPostsWithContent } from '@/app/_lib/content-loader';
import { KOTOBA_PER_PAGE } from '../../_lib/kotoba-utils';
import KotobaContainer from '../../_components/KotobaContainer';
import KotobaTag from '../../_components/KotobaTag';
import { getEmojiFavicon } from '@/utils/favicon';

export const metadata: Metadata = {
  title: '言叶',
  icons: getEmojiFavicon('🍃'),
};

export async function generateStaticParams() {
  const posts = await getAllKotobaPosts();
  const totalPages = Math.max(1, Math.ceil(posts.length / KOTOBA_PER_PAGE));
  return Array.from({ length: totalPages }, (_, i) => ({ page: [String(i + 1)] }));
}

export default async function KotobaPage({
  params,
}: {
  params: Promise<{ page?: string[] }>;
}) {
  const { page: pageParam = [] } = await params;
  if (pageParam.length > 1) notFound();

  const currentPage = +(pageParam[0] || 1);
  if (isNaN(currentPage) || currentPage < 1) notFound();

  const posts = await getAllKotobaPostsWithContent();

  // Build tag list sorted by post count
  const tagCountMap = new Map<string, number>();
  posts.forEach((p) => p.tags.forEach((tag) => tagCountMap.set(tag, (tagCountMap.get(tag) ?? 0) + 1)));
  const sortedTags = Array.from(tagCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));

  const TagSection = sortedTags.length > 0 && (
    <div className="mt-3 flex flex-wrap gap-y-2">
      {sortedTags.map(({ tag, count }) => (
        <KotobaTag key={tag} tag={tag} count={count} />
      ))}
    </div>
  );

  return (
    <>
      <PageHero title="言叶" after={TagSection || undefined} />
      <div className="g-container pb-20">
        <KotobaContainer posts={posts} currentPage={currentPage} urlPrefix="/kotoba" />
      </div>
    </>
  );
}
