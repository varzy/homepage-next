import PageHeader from '@/app/_components/PageHeader';
import SiteFooter from '@/app/_components/SiteFooter';

export default function KotobaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PageHeader />
      <main>{children}</main>
      <SiteFooter links={[{ label: 'Telegram', href: 'https://t.me/varzyme', target: '_blank' }]} />
    </div>
  );
}
