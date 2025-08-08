import { ReactNode } from 'react';
import Link from 'next/link';

export interface FancyLinkProps {
  href: string;
  target?: string;
  label: string;
  icon?: ReactNode;
}

export default function FancyLink({ href, target = '_self', label, icon }: FancyLinkProps) {
  return (
    <Link className="inline-block transition-all duration-200 ease-in-out" href={href} target={target}>
      <span className="flex items-center">
        {icon && <span className="icon align-center me-2.5 flex">{icon}</span>}
        <span className="relative whitespace-nowrap ease-in-out">{label}</span>
      </span>
    </Link>
  );
}
