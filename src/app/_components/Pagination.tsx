import Link from 'next/link';
import { ReactNode } from 'react';

export interface PaginationItem {
  href: string;
  label: string;
}

export interface PaginationProps {
  ariaLabel?: string;
  prev?: PaginationItem;
  next?: PaginationItem;
  children: ReactNode;
}

const Goto = ({ href, label }: PaginationItem) => (
  <Link className="hover:underline" href={href}>
    {label}
  </Link>
);

export default function Pagination({
  ariaLabel = '分页导航',
  prev,
  next,
  children,
}: PaginationProps) {
  return (
    <nav className="mt-14" aria-label={ariaLabel}>
      <ul className="m-0 grid list-none grid-cols-[1fr_auto_1fr] items-center p-0">
        <li className="text-left">{prev && <Goto {...prev} />}</li>
        <li className="text-secondary text-center">{children}</li>
        <li className="text-right">{next && <Goto {...next} />}</li>
      </ul>
    </nav>
  );
}
