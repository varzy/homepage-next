import { ReactNode } from 'react';
import { FaRegPenToSquare } from 'react-icons/fa6';
import { FaGithub, FaInstagram, FaRegAddressCard, FaTelegramPlane } from 'react-icons/fa';
import { SiDoubanread } from 'react-icons/si';
import { RiNeteaseCloudMusicLine } from 'react-icons/ri';
import LocaleToggle from '@/app/_components/LocaleToggle';
import Avatar from '@/app/_components/Avatar';
import FancyLink, { FancyLinkProps } from '@/app/_components/FancyLink';
import Link from 'next/link';

export interface I18nProps {
  blog: string;
  telegram: string;
  github: string;
  instagram: string;
  douban: string;
  neteaseMusic: string;
  resume: string;
  iam: ReactNode;
  name: string;
  pronounce: string;
}

export default function HomeWrapper({ t, children }: { t: I18nProps; children: ReactNode }) {
  const linksNew = [
    { label: '我', alias: 'README', href: '/' },
    { label: '文章', alias: 'Writing', href: '/blog' },
    { label: '朋友圈', alias: 'Moments', href: 'https://t.me/aboutzy', target: '_blank' },
    { label: '随手拍', alias: 'Gallery', href: 'https://instagram.com/varzyme', target: '_blank' },
    { label: '书影音', alias: 'Douban', href: 'https://www.douban.com/people/varzy/', target: '_blank' },
    {
      label: '在听',
      alias: 'Listening',
      href: 'https://music.163.com/playlist?id=39874340&userid=45403592',
      target: '_blank',
    },
    {
      label: '代码',
      alias: 'Github',
      href: 'https://github.com/varzy',
      target: '_blank',
    },
  ];

  const links: FancyLinkProps[] = [
    { label: t.blog, href: '/blog', icon: <FaRegPenToSquare /> },
    { label: t.telegram, href: 'https://t.me/aboutzy', target: '_blank', icon: <FaTelegramPlane /> },
    { label: t.github, href: 'https://github.com/varzy', target: '_blank', icon: <FaGithub /> },
    { label: t.instagram, href: 'https://instagram.com/varzyme', target: '_blank', icon: <FaInstagram /> },
    { label: t.douban, href: 'https://www.douban.com/people/varzy/', target: '_blank', icon: <SiDoubanread /> },
    {
      label: t.neteaseMusic,
      href: 'https://music.163.com/playlist?id=39874340&userid=45403592',
      icon: <RiNeteaseCloudMusicLine />,
    },
    { label: t.resume, href: '/resume', icon: <FaRegAddressCard /> },
  ];

  const Row = ({ title, children }: { title?: string; children: ReactNode }) => (
    <div className="mb-12">
      <div className="mb-3">{title && <h1 className="text-base font-bold">{title}</h1>}</div>
      <div className="">{children}</div>
    </div>
  );

  return (
    <div className="container mx-auto text-lg max-w-2xl px-5 py-20 leading-8 tracking-wider [&_a]:hover:underline">
      <div className="">
        <div className="flex-1">
          <div className="flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-4xl font-bold">Hi,</p>
              <p className="text-4xl font-bold">
                <span>I'm </span>
                <strong className="italic">{t.name}</strong>
                <span className="text-secondary text-base font-light">&nbsp;&nbsp;/{t.pronounce}/</span>
              </p>
              <p>🧑‍💻Web Developer. 📝Blogger. 🫣INFJ.</p>
            </div>
          </div>
        </div>
        <div className="flex-1 text-black font-black flex gap-6 mt-10">
          {linksNew.map((link, index) => (
            <p key={index}>
              {/* <span>- </span> */}
              <Link href={link.href} target={link.target}>
                <span>{link.label}</span>
                {/* <span> / </span> */}
                {/* <span>{link.alias}</span> */}
              </Link>
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
