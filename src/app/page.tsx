import HomeWrapper from '@/app/_components/HomeWrapper';
import FancyLink from '@/app/_components/FancyLink';

export default function Home() {
  return (
    <HomeWrapper
      t={{
        iam: `我是`,
        name: `贼歪`,
        pronounce: `zei 'wai`,
        telegram: `Telegram`,
        github: `Github`,
        instagram: `Instagram`,
        blog: `博 客`,
        douban: `豆 瓣`,
        neteaseMusic: `网 易 云`,
        resume: `简 历`,
      }}
    >
      <p>
        90 后程序员，现居北京。ACG
        爱好者，摇滚乐爱好者。半个极客，热衷于捣鼓软件和数码产品。断舍离主义者，喜欢简洁的桌面和无 LOGO 的衣服。
      </p>
      <p>
        我的博客记录了一些
        <FancyLink href="/categories/nichijou" label="日常随笔" />
        和
        <FancyLink href="/categories/coding" label="编程笔记" />
        。我的 Telegram 频道「
        <FancyLink href="https://t.me/aboutzy" label="贼歪说" target="_blank" />
        」则是朋友圈，欢迎订阅。
      </p>
      <p>尽管平平无奇，但仍然希望这个世界的运行轨迹能因我而发生一丝偏转。我正在努力。</p>
    </HomeWrapper>
  );
}
