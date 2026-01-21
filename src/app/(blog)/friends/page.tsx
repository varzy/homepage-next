import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import { getPageWithContent } from '@/app/_lib/content-loader';
import { getEmojiFavicon } from '@/utils/favicon';
import MdxRenderer from '../_components/MdxRenderer';

export const metadata: Metadata = {
  title: 'Friends',
  icons: getEmojiFavicon('✌️'),
};

export default async function Friends() {
  const postWithContent = await getPageWithContent('friends');
  if (!postWithContent) notFound();

  return (
    <BlogPageContainer pageHero={{ title: `Friends` }}>
      <MdxRenderer source={postWithContent.content} />
    </BlogPageContainer>
  );
}
