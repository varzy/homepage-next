import { Metadata } from 'next';
import { getEmojiFavicon } from '@/utils/favicon';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '友情链接',
  icons: getEmojiFavicon('✌️'),
};

export default function Friends() {
  return (
    <BlogPageContainer pageHero={{ title: `友情链接` }}>
      <Link className="underline" target="_blank" href="https://ikangjia.cn/">
        林深时觉寒
      </Link>
    </BlogPageContainer>
  );
}
