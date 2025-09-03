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
  const moreThanOnePage = totalPage > 1;

  const Goto = (page: number, label: string) => (
    <Link className="hover:underline" href={`${urlPrefix}/${page}`}>
      {label}
    </Link>
  );

  return (
    <div className="mt-12">
      {moreThanOnePage && (
        <div className="flex items-center justify-between">
          <div className="prev flex-1 text-left">{showPrev && Goto(current - 1, '< Prev')}</div>
          <div className="current text-secondary flex-1 text-center">
            {current} / {totalPage}
          </div>
          <div className="next flex-1 text-right">{showNext && Goto(current + 1, 'Next >')}</div>
        </div>
      )}
    </div>
  );
}
