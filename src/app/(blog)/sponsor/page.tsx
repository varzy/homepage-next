import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import { Metadata } from 'next';
import { getEmojiFavicon } from '@/utils/favicon';
import Prose from '@/app/(blog)/_components/Prose';
import { getAllPosts } from '@/app/_lib/content-loader';

export const metadata: Metadata = {
  title: `Buy me a Coffee`,
  icons: getEmojiFavicon('☕️'),
};

export default async function Sponsor() {
  const posts = await getAllPosts();
  const totalPosts = posts.length;

  return (
    <BlogPageContainer pageHero={{ title: `Buy me a Coffee` }}>
      <Prose>
        <p>博客目前共有 {totalPosts} 篇文章。如果你喜欢我的内容，或者它们给你带来帮助，或许可以请我喝一杯咖啡☕️？</p>
        <p></p>
        <img src="https://cdn.sa.net/2025/09/05/wFI1csOjDp8A96f.jpg" alt="zy 的支付宝赞赏码" />
      </Prose>
    </BlogPageContainer>
  );
}
