import SiteFooter from '@/app/_components/SiteFooter';
import SiteHeader from '@/app/_components/SiteHeader';

export default function KotobaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
