import Pagination from './Pagination';

export interface NumberedPaginationProps {
  total: number;
  current: number;
  pageSize: number;
  urlPrefix: string;
}

export default function NumberedPagination({
  total,
  current,
  pageSize,
  urlPrefix,
}: NumberedPaginationProps) {
  const showPrev = current > 1;
  const showNext = current * pageSize < total;
  const totalPage = Math.ceil(total / pageSize);

  const pageHref = (page: number) => (page === 1 ? urlPrefix : `${urlPrefix}/${page}`);

  return (
    <Pagination
      prev={showPrev ? { href: pageHref(current - 1), label: '< Prev' } : undefined}
      next={showNext ? { href: pageHref(current + 1), label: 'Next >' } : undefined}
    >
      {current} of {totalPage}
    </Pagination>
  );
}
