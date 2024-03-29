import { Metadata } from 'next';
import { getEmojiFavicon } from '@/utils/favicon';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';

export const metadata: Metadata = {
  title: '友情链接',
  icons: getEmojiFavicon('✌️'),
};

export default function Friends() {
  return (
    <BlogPageContainer pageHero={{ title: `友情链接`, after: `` }}>
      <p>空空如也...</p>
      <p>如你所见，我的朋友很少😭</p>
    </BlogPageContainer>
  );
}
