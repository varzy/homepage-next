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
  const links: FancyLinkProps[] = [
    { label: t.readme, href: '/readme' },
    { label: t.blog, href: '/blog' },
    { label: t.telegram, href: 'https://t.me/aboutzy', target: '_blank' },
    { label: t.instagram, href: 'https://instagram.com/varzyme', target: '_blank' },
    { label: t.douban, href: 'https://www.douban.com/people/varzy/', target: '_blank' },
    {
      label: t.neteaseMusic,
      href: 'https://music.163.com/playlist?id=39874340&userid=45403592',
    },
    { label: t.github, href: 'https://github.com/varzy', target: '_blank' },
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
      <LocaleToggle />
      <div className="container mx-auto max-w-3xl px-5 py-20 leading-7 tracking-wider sm:px-16 [&_a]:font-black [&_a]:text-black [&_a]:hover:underline">
        <Row>
          <div className="flex flex-col-reverse gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <p className="text-4xl font-bold">Hi,</p>
              <p className="text-4xl font-bold">
                <span>{t.iam}</span>
                <strong className="italic">贼歪</strong>
                <span className="text-secondary text-base font-light">&nbsp;&nbsp;/zeɪ 'waɪ/</span>
              </p>
              <p>🧑‍💻Web Developer. 📝Blogger. 🫣INFJ.</p>
            </div>
            <div className="flex justify-center md:justify-end">
              <Avatar />
            </div>
          </div>
        </Row>
        <Row>
          <article className="[&_p]:mb-3 [&_p]:last:mb-0">{children}</article>
        </Row>
        <Row>
          <div className="flex flex-wrap gap-6">
            {links.map((link, index) => (
              <Link href={link.href} target={link.target} key={index}>
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
        </Row>
      </div>
    </>
  );
}
