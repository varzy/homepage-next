import { Metadata } from 'next';
import { getEmojiFavicon } from '@/utils/favicon';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import MdxRenderer from '../_components/MdxRenderer';
import { notFound } from 'next/navigation';
import { getPageWithContent } from '@/app/_lib/content-loader';

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
