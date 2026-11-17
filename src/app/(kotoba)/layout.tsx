import SiteHeader from '@/app/_components/SiteHeader';

export default function KotobaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader
        links={[
          { label: '贼歪说', href: '/kotoba' },
          { label: '月刊', href: '/kotoba/monthly' },
          { label: 'Telegram', href: 'https://t.me/aboutzy', target: '_blank' },
        ]}
      />
      <main className="g-container-content">{children}</main>
    </>
  );
}
