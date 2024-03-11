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
    <Link
      className="group inline-block transition-all duration-200 ease-in-out hover:text-indigo-500"
      href={href}
      target={target}
    >
      <span className="flex items-center">
        {icon && <span className="icon align-center mr-2.5 flex">{icon}</span>}
        <span className="relative whitespace-nowrap ease-in-out before:absolute before:bottom-[2.5px] before:left-0 before:z-[-1] before:h-2 before:w-full before:bg-indigo-200 before:transition-all before:duration-200 group-hover:before:h-[2px]">
          {label}
        </span>
      </span>
    </Link>
  );
}
