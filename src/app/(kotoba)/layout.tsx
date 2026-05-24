import PageHeader from '@/app/_components/PageHeader';

export default function KotobaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <PageHeader />
      <main>{children}</main>
    </div>
  );
}
