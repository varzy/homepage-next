import { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/app/_components/PageHero';
import { getAllKotobaMonths } from '@/app/_lib/kotoba-loader';
import { formatYearMonth } from '@/utils/date';
import { getEmojiFavicon } from '@/utils/favicon';

export const metadata: Metadata = {
  title: '月刊',
  icons: getEmojiFavicon('📅'),
};

export default async function KotobaMonthlyPage() {
  const months = await getAllKotobaMonths();

  return (
    <>
      <PageHero title="月刊" />

      <div className="g-container">
        <ul className="m-0 list-none p-0">
          {months.map((m, index) => (
            <li key={index} className="mb-3 ">
              <Link
                href={`/kotoba/monthly/${m.year}/${m.month}`}
                className="me-3 inline-block w-22 text-sm last:me-0 hover:underline"
              >
                <span>{formatYearMonth(m.year, m.month)}</span>
              </Link>
              <span className="text-secondary ms-4"> {m.postsCount}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
