import SiteHeader from '@/app/_components/SiteHeader';

export default async function PagesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="pb-48">
      <SiteHeader />
      <div className="g-container pt-10">
        <main>{children}</main>
      </div>
    </div>
  );
}
