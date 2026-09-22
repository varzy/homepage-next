import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageHero from '@/app/_components/PageHero';
import { getAllKotobaMonths, getKotobaPostsWithContentByMonth } from '@/app/_lib/kotoba-loader';
import { formatYearMonth } from '@/utils/date';
import { getEmojiFavicon } from '@/utils/favicon';
import KotobaCard from '../../../../_components/KotobaCard';
import MonthlyPagination from '../../../../_components/MonthlyPagination';

export const dynamicParams = false;

export async function generateStaticParams() {
  const months = await getAllKotobaMonths();
  return months.map((m) => ({ year: m.year, month: m.month }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}): Promise<Metadata> {
  const { year, month } = await params;
  return { title: formatYearMonth(year, month), icons: getEmojiFavicon('📅') };
}

export default async function KotobaMonthlyDetailPage({
  params,
}: {
  params: Promise<{ year: string; month: string }>;
}) {
  const { year, month } = await params;

  const [posts, months] = await Promise.all([
    getKotobaPostsWithContentByMonth(year, month),
    getAllKotobaMonths(),
  ]);
  if (posts.length === 0) notFound();

  return (
    <>
      <PageHero title={formatYearMonth(year, month)} />

      <div className="g-container">
        <div>
          {posts.reverse().map((post) => (
            <KotobaCard key={post.page_id} post={post} />
          ))}
        </div>
        <MonthlyPagination months={months} year={year} month={month} />
      </div>
    </>
  );
}
