import Avatar from './_components/Avatar';
import { ReactNode } from 'react';
import LocaleToggle from '@/app/_components/LocaleToggle';
import SocialTag, { SocialTagProps } from '@/app/_components/SocialTag';
import { FaGithub, FaInstagram, FaRegAddressCard, FaTelegramPlane } from 'react-icons/fa';
import { FaRegPenToSquare } from 'react-icons/fa6';
import { SiDoubanread } from 'react-icons/si';
import { RiNeteaseCloudMusicLine } from 'react-icons/ri';

export default function Home() {
  const links: SocialTagProps[] = [
    { label: '博 客', href: '/categories/nichijou', icon: <FaRegPenToSquare /> },
    { label: 'Telegram', href: 'https://t.me/aboutzy', target: '_blank', icon: <FaTelegramPlane /> },
    { label: 'Github', href: 'https://github.com/varzy', target: '_blank', icon: <FaGithub /> },
    { label: 'Instagram', href: 'https://instagram.com/varzyme', target: '_blank', icon: <FaInstagram /> },
    { label: '豆 瓣', href: 'https://www.douban.com/people/varzy/', icon: <SiDoubanread /> },
    {
      label: '网 易 云',
      href: 'https://music.163.com/playlist?id=39874340&userid=45403592',
      icon: <RiNeteaseCloudMusicLine />,
    },
    { label: '简 历', href: '/resume', icon: <FaRegAddressCard /> },
  ];

  const Row = ({ title, children }: { title?: string; children: ReactNode }) => (
    <div className="mb-12 flex flex-wrap sm:mb-14">
      <div className="left mb-3 flex w-full shrink-0 justify-start sm:mb-0 sm:w-1/6 sm:justify-end">
        {title && <h1 className="text-base font-bold text-black">{title}</h1>}
      </div>
      <div className="right ml-0 flex-1 sm:mx-8">{children}</div>
    </div>
  );

  return (
    <>
      <LocaleToggle current="CN" />
      <div className="container mx-auto max-w-4xl px-6 py-24 sm:px-8">
        <div className="">
          <Row>
            <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between">
              <div className="info">
                <p className="mb-3 text-4xl font-bold">Hi,</p>
                <p className="mb-3 text-3xl font-bold">
                  我是<strong className="inline-block italic text-violet-800">贼歪</strong>
                  <span className="inline-block text-lg font-light">&nbsp;&nbsp;/zei: wai/</span>
                </p>
                <p>🧑‍💻Web Developer. 📝Blogger. 🫣INFJ.</p>
              </div>
              <div className="avatar flex justify-center md:justify-end">
                <Avatar />
              </div>
            </div>
          </Row>
          <Row title="about me">
            <div className="leading-7">
              <p className="mb-4">
                90 后程序员，现居北京。ACG 爱好者，老摇滚爱好者，半个极客。断舍离主义者，喜欢简洁的桌面和无 LOGO
                的衣服。
              </p>
              <p className="mb-4">
                我的博客有几篇长文，那里是思绪的孤岛，欢迎登陆。我的 Telegram
                频道「贼歪说」是朋友圈，欢迎订阅。你还可以在豆瓣翻一翻我标记的书影音，或者去网易云听一听我喜欢的音乐。
              </p>
              <p>尽管平平无奇，但仍然希望这个世界的运行轨迹能因我而发生一丝偏转。我正在努力。</p>
            </div>
          </Row>
          <Row title="find me">
            <div className="flex flex-wrap tracking-wider">
              {links.map((link, index) => (
                <div className="mb-3 basis-1/2 sm:basis-1/3 md:basis-1/4" key={index}>
                  <SocialTag href={link.href} target={link.target} label={link.label} icon={link.icon} />
                </div>
              ))}
            </div>
          </Row>
        </div>
      </div>
    </>
  );
}
