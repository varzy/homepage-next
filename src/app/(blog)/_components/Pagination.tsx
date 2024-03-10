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
  const moreThanOnePage = total > pageSize;

  const Goto = (page: number, label: string) => <Link href={`${urlPrefix}/${page}`}>{label}</Link>;

  return (
    <>
      {moreThanOnePage && (
        <div className="align-center flex justify-between py-4">
          <div className="prev">{showPrev && Goto(current - 1, '< Prev')}</div>
          <div className="next">{showNext && Goto(current + 1, 'Next >')}</div>
        </div>
      )}
    </>
  );
}
