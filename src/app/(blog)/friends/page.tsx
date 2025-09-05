import { Metadata } from 'next';
import { getEmojiFavicon } from '@/utils/favicon';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import Link from 'next/link';
import Prose from '@/app/(blog)/_components/Prose';

export const metadata: Metadata = {
  title: 'Friends',
  icons: getEmojiFavicon('✌️'),
};

export default function Friends() {
  const friends = [
    { label: '林深时觉寒', href: 'https://ikangjia.cn/' },
    { label: 'Airing 的小屋', href: 'https://blog.ursb.me/' },
  ];

  return (
    <BlogPageContainer pageHero={{ title: `Friends` }}>
      <Prose>
        <p>欢迎互换友链，你可以发送邮件到 varzyme#gmail.com 告知我你的站点信息。以下是我的朋友们，去看看吧。</p>
      </Prose>

      <div className="mt-8">
        {friends.map((friend) => (
          <p key={friend.label} className="pb-4">
            <Link className="underline" target="_blank" href={friend.href}>
              {friend.label}
            </Link>
          </p>
        ))}
      </div>
    </BlogPageContainer>
  );
}
