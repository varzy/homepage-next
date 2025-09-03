import MdxRenderer from '@/app/(blog)/_components/MdxRenderer';
import { type Metadata } from 'next';
import PageHeader from '@/app/_components/PageHeader';
import { getPageWithContent } from '@/app/_lib/content-loader';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: `赵越的简历`,
};

export default async function Resume() {
  const postWithContent = await getPageWithContent('resume');
  if (!postWithContent) notFound();

  return (
    <div className="pb-48">
      <PageHeader />
      <div className="g-container">
        <MdxRenderer source={postWithContent.content} />
      </div>
    </div>
  );
}
