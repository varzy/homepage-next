import SiteHeader from '@/app/_components/SiteHeader';

export default async function PagesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <SiteHeader />
      <div className="g-container-content">
        <main>{children}</main>
      </div>
    </>
  );
}
