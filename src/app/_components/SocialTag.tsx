import { ReactNode } from 'react';
import Link from 'next/link';

export interface SocialTagProps {
  href: string;
  target?: string;
  label: string;
  icon: ReactNode;
}

export default function SocialTag({ href, target = '_self', label, icon }: SocialTagProps) {
  return (
    <Link
      className="group mr-6 inline-block transition-all duration-200 ease-in-out hover:text-violet-500"
      href={href}
      target={target}
    >
      <div className="flex items-center">
        <div className="icon align-center flex">{icon}</div>
        {/*<div*/}
        {/*  className="relative ml-2 ease-in-out before:absolute before:bottom-0 before:left-0 before:z-[-1] before:h-2 before:w-full before:bg-violet-100 before:transition-all before:duration-200 group-hover:before:h-[2px] ">*/}
        {/*  {label}*/}
        {/*</div>*/}
        <div className="g-link-fancy ml-2">{label}</div>
      </div>
    </Link>
  );
}
