import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import { Metadata } from 'next';
import { getEmojiFavicon } from '@/utils/favicon';
import Prose from '@/app/(blog)/_components/Prose';

export const metadata: Metadata = {
  title: `Buy me a Coffee`,
  icons: getEmojiFavicon('☕️'),
};

export default async function Sponsor() {
  return (
    <BlogPageContainer pageHero={{ title: `Buy me a Coffee` }}>
      <Prose>
        <p>如果你喜欢我的内容，或者它们给你带来帮助，或许可以请我喝一杯咖啡。</p>
        <div className="flex justify-center">
          <img className="w-2/3" src="https://cdn.sa.net/2025/09/05/wFI1csOjDp8A96f.jpg" alt="zy 的支付宝赞赏码" />
        </div>
      </Prose>
    </BlogPageContainer>
  );
}
