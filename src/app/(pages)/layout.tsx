import PageHeader from "@/app/_components/PageHeader";

export default async function PagesLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="pb-48">
      <PageHeader />
      <div className="g-container pt-10">
        <main>{children}</main>
      </div>
    </div>
  );
}
