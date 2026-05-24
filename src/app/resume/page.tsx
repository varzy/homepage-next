import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import MdxRenderer from '@/app/_components/MdxRenderer';
import PageHeader from '@/app/_components/PageHeader';
import { getPageWithContent } from '@/app/_lib/blog-loader';
import { getEmojiFavicon } from '@/utils/favicon';

export const metadata: Metadata = {
  title: `赵越的简历`,
  icons: getEmojiFavicon('🔖'),
};

export default async function Resume() {
  const postWithContent = await getPageWithContent('resume');
  if (!postWithContent) notFound();

  return (
    <div className="pb-48">
      <PageHeader />
      <div className="g-container pt-10">
        <MdxRenderer source={postWithContent.content} />
      </div>
    </div>
  );
}
