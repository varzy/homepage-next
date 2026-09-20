import Link from 'next/link';

export interface PaginationProps {
  total: number;
  current: number;
  pageSize: number;
  urlPrefix: string;
}

export default function Pagination({ total, current, pageSize, urlPrefix }: PaginationProps) {
  const showPrev = current > 1;
  const showNext = current * pageSize < total;
  const totalPage = Math.ceil(total / pageSize);

  const Goto = (page: number, label: string) => (
    <Link className="hover:underline" href={page === 1 ? urlPrefix : `${urlPrefix}/${page}`}>
      {label}
    </Link>
  );

  return (
    <nav className="mt-14" aria-label="分页导航">
      <ul className="m-0 grid list-none grid-cols-[1fr_auto_1fr] items-center p-0">
        <li className="prev text-left">{showPrev && Goto(current - 1, '< Prev')}</li>
        <li className="current text-secondary text-center">
          {current} of {totalPage}
        </li>
        <li className="next text-right">{showNext && Goto(current + 1, 'Next >')}</li>
      </ul>
    </nav>
  );
}
