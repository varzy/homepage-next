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
  readme: string;
}

export default function HomeWrapper({ t, children }: { t: I18nProps; children: ReactNode }) {
  const links = [
    { label: '我', alias: 'README', href: '/readme' },
    { label: '文章', alias: 'Writing', href: '/blog' },
    { label: '朋友圈', alias: 'Thinking', href: 'https://t.me/aboutzy', target: '_blank' },
    { label: '随手拍', alias: 'Gallery', href: 'https://instagram.com/varzyme', target: '_blank' },
    { label: '书影音', alias: 'Douban', href: 'https://www.douban.com/people/varzy/', target: '_blank' },
    {
      label: '歌单',
      alias: 'Listening',
      href: 'https://music.163.com/playlist?id=39874340&userid=45403592',
    },
    { label: 'Github', alias: 'Coding', href: 'https://github.com/varzy', target: '_blank' },
    // { label: t.resume, href: '/resume' },
  ];

  const Row = ({ title, children }: { title?: string; children: ReactNode }) => (
    <div className="mb-12">
      <div className="mb-3">{title && <h1 className="text-base font-bold">{title}</h1>}</div>
      <div className="">{children}</div>
    </div>
  );

  return (
    <>
      <div className="container mx-auto max-w-screen-lg px-5 py-40 leading-7 tracking-wider sm:px-20 [&_a]:font-black [&_a]:text-black [&_a]:hover:underline">
        <Row>
          <div className="flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-5xl font-bold">
                <strong className="italic">贼歪</strong>
                <span className="text-secondary text-base font-light">&nbsp;&nbsp;/zeɪ 'waɪ/</span>
              </p>
              <p>🧑‍💻Web Developer. 📝Blogger. 🫣INFJ.</p>
            </div>
          </div>
        </Row>
        <Row>
          <div>
            {links.map((link, index) => (
              <p key={index}>
                <Link href={link.href} target={link.target} className="flex items-center">
                  <span className="w-20">{link.label}</span>
                  <span className="text-secondary font-normal">{link.alias}</span>
                </Link>
              </p>
            ))}
          </div>
        </Row>
      </div>
    </>
  );
}
