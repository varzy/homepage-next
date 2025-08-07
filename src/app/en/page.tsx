import HomeWrapper from '@/app/_components/HomeWrapper';
import { Metadata } from 'next';
import FancyLink from '@/app/_components/FancyLink';

export const metadata: Metadata = {
  title: 'ZY',
};

export default function Home() {
  return (
    <HomeWrapper
      t={{
        iam: <span>I&apos;m </span>,
        name: `ZY`,
        pronounce: `zeɪ 'waɪ`,
        telegram: `Telegram`,
        github: `Github`,
        instagram: `Instagram`,
        blog: `Blog`,
        douban: `Douban`,
        neteaseMusic: `Netease`,
        resume: `Resume`,
      }}
    >
      <p>
        I&apos;m a software engineer living in Beijing. I enjoy watching anime, reading comics, playing video games, and
        listening to music especially rock. Just like most geeks, I&apos;m always interested at softwares and consumer
        electronics. I&apos;m also a minimalist.
      </p>
      <p>
        There are some pieces of my <FancyLink href="/categories/nichijou" label="Everyday Life" /> and some{' '}
        <FancyLink href="/categories/coding" label="Coding Notes" /> in my blog, I also have a{' '}
        <FancyLink href="https://t.me/aboutzy" label="Telegram Channel" target="_blank"></FancyLink> and welcome your
        subscription.
      </p>
      <p>This world is so wild, but I do hope I can change it even just a bit.</p>
    </HomeWrapper>
  );
}
