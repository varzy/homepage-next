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
      <p>I’m a Software Engineer living in Beijing, i’m also a minimalist. I am a Anime and rock music</p>
      <p>
        My blog has some pieces of my life and some tech notes, i also have a{' '}
        <Link className="g-link-fancy" href="https://t.me/aboutzy">
          Telegram Channel
        </Link>{' '}
        and welcome your subscription
      </p>
      <p>This world is so wild and I do hope I can change it even a little.</p>
    </HomeWrapper>
  );
}
