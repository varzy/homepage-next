import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageHeader from '@/app/_components/PageHeader';
import { getPageWithContent } from '@/app/_lib/page-loader';
import { getEmojiFavicon } from '@/utils/favicon';

export const metadata: Metadata = {
  title: 'Friends',
  icons: getEmojiFavicon('✌️'),
};

export default async function PagesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const postWithContent = await getPageWithContent('friends');
  if (!postWithContent) notFound();

  return (
    <div className="pb-48">
      <PageHeader />
      <div className="g-container pt-10">
        <main>{children}</main>
      </div>
    </div>
  );
}
