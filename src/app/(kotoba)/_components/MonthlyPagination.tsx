import Pagination from '@/app/_components/Pagination';
import { KotobaMonth } from '@/app/_lib/kotoba-loader';
import { formatYearMonth } from '@/utils/date';

interface MonthlyPaginationProps {
  months: KotobaMonth[];
  year: string;
  month: string;
}

function monthHref(m: KotobaMonth) {
  return `/kotoba/monthly/${m.year}/${m.month}`;
}

export default function MonthlyPagination({ months, year, month }: MonthlyPaginationProps) {
  const currentIndex = months.findIndex((m) => m.year === year && m.month === month);
  if (currentIndex === -1) return null;

  const newer = months[currentIndex - 1];
  const older = months[currentIndex + 1];

  return (
    <Pagination
      ariaLabel="月份导航"
      prev={
        newer
          ? {
              href: monthHref(newer),
              label: `‹ ${formatYearMonth(newer.year, newer.month, 'MMM')}`,
            }
          : undefined
      }
      next={
        older
          ? {
              href: monthHref(older),
              label: `${formatYearMonth(older.year, older.month, 'MMM')} ›`,
            }
          : undefined
      }
    >
      {formatYearMonth(year, month)}
    </Pagination>
  );
}
