'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function LocaleToggle() {
  const pathname = usePathname();

  const Switcher = ({ label, href }: { label: string; href: string }) => {
    return (
      <Link href={href} className="p-2 font-bold transition-all duration-200 ease-in-out hover:text-indigo-500">
        {label}
      </Link>
    );
  };

  return (
    <div className="absolute right-5 top-4">
      {pathname === '/' ? <Switcher href="/en" label="EN" /> : <Switcher href="/" label="中文" />}
    </div>
  );
}
