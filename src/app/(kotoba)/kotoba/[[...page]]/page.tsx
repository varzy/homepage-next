import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PageHero from '@/app/_components/PageHero';
import { getAllKotobaPosts, getAllKotobaPostsWithContent } from '@/app/_lib/kotoba-loader';
import { buildIndexPageParams } from '@/app/_lib/pagination-utils';
import { SITE_CONFIG } from '@/site.config';
import { getEmojiFavicon } from '@/utils/favicon';
import KotobaContainer from '../../_components/KotobaContainer';

export const metadata: Metadata = {
  title: '贼歪说',
  icons: getEmojiFavicon('🍃'),
};

export async function generateStaticParams() {
  const posts = await getAllKotobaPosts();
  return buildIndexPageParams(posts.length, SITE_CONFIG.kotobaPerPage, { keepEmpty: true });
}

export default async function KotobaPage({ params }: { params: Promise<{ page?: string[] }> }) {
  const { page: pageParam = [] } = await params;
  if (pageParam.length > 1) notFound();

  const currentPage = +(pageParam[0] || 1);
  if (isNaN(currentPage) || currentPage < 1) notFound();

  const posts = await getAllKotobaPostsWithContent();

  return (
    <>
      <PageHero
        title="贼歪说"
        after={
          <div>
            我的日常碎片和随口说说。你也可以在我的 Telegram 频道「
            <Link
              href="https://t.me/aboutzy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              贼歪说
            </Link>
            」浏览更古早的内容。
          </div>
        }
      />
      <div className="g-container">
        <KotobaContainer posts={posts} currentPage={currentPage} urlPrefix="/kotoba" />
      </div>
    </>
  );
}
