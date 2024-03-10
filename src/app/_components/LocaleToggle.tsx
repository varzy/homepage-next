'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function LocaleToggle() {
  const pathname = usePathname();

  const SwitchItem = ({ path, label }: { path: '/en'; label: 'EN' } | { path: '/'; label: '中' }) => {
    const isMatch = pathname === path;
    return (
      <>
        {isMatch ? (
          <span>{label}</span>
        ) : (
          <Link className="g-link-fancy" href={path}>
            {label}
          </Link>
        )}
      </>
    );
  };

  return (
    <div className="absolute right-6 top-4">
      <SwitchItem path="/en" label="EN" />
      &nbsp;&nbsp;/&nbsp;&nbsp;
      <SwitchItem path="/" label="中" />
    </div>
  );
}
