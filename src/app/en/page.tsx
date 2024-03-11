import HomeWrapper from '@/app/_components/HomeWrapper';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ZY',
};

export default function Home() {
  return (
    <HomeWrapper
      t={{
        iam: `I'm `,
        name: `ZY`,
        pronounce: `zei: wai`,
        telegram: `Telegram`,
        github: `Github`,
        instagram: `Instagram`,
        blog: `Blog`,
        douban: `Douban`,
        neteaseMusic: `Netease`,
        resume: `Resume`,
      }}
    >
      <p>I'm a Software Engineer living in Beijing. I am a fan of ACG and  I'm also a minimalist. I am a Anime and rock music</p>
      <p>
        There are some pieces of my <Link className="g-link-fancy" href="/categories/nichijou">Everyday Life</Link> and some <Link className="g-link-fancy" href="/categories/coding">Coding Notes</Link> in my blog, I also have a <Link className="g-link-fancy" href="https://t.me/aboutzy">Telegram Channel</Link> and welcome your subscription.
      </p>
      <p>This world is wild and I do hope I can change it even just a bit.</p>
    </HomeWrapper>
  );
}
