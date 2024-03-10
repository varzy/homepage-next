import Link from 'next/link';

export default function LocaleToggle({ current }: { current: 'CN' | 'EN' }) {
  return (
    <div className="absolute right-4 top-4">
      <Link href={current === 'CN' ? '/en' : '/'}>{current === 'CN' ? 'EN' : '中'}</Link>
    </div>
  );
}
