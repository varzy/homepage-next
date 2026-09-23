import Link from 'next/link';
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

  const prev = months[currentIndex - 1];
  const next = months[currentIndex + 1];

  const Goto = (target: KotobaMonth, label: string) => (
    <Link className="hover:underline" href={monthHref(target)}>
      {label}
    </Link>
  );

  return (
    <nav className="mt-14" aria-label="月份导航">
      <ul className="m-0 grid list-none grid-cols-[1fr_auto_1fr] items-center p-0">
        <li className="prev text-left">{prev && Goto(prev, '‹ Prev')}</li>
        <li className="current text-secondary text-center">{formatYearMonth(year, month)}</li>
        <li className="next text-right">{next && Goto(next, 'Next ›')}</li>
      </ul>
    </nav>
  );
}
