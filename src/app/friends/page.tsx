import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPageWithContent } from '@/app/_lib/blog-loader';
import { getEmojiFavicon } from '@/utils/favicon';
import MdxRenderer from '../_components/MdxRenderer';
import PageHeader from '../_components/PageHeader';

export const metadata: Metadata = {
  title: 'Friends',
  icons: getEmojiFavicon('✌️'),
};

export default async function Friends() {
  const postWithContent = await getPageWithContent('friends');
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
