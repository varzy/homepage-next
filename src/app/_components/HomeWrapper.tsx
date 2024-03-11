import { ReactNode } from 'react';
import { FaRegPenToSquare } from 'react-icons/fa6';
import { FaGithub, FaInstagram, FaRegAddressCard, FaTelegramPlane } from 'react-icons/fa';
import { SiDoubanread } from 'react-icons/si';
import { RiNeteaseCloudMusicLine } from 'react-icons/ri';
import LocaleToggle from '@/app/_components/LocaleToggle';
import Avatar from '@/app/_components/Avatar';
import FancyLink, { FancyLinkProps } from '@/app/_components/FancyLink';

export interface I18nProps {
  blog: string;
  telegram: string;
  github: string;
  instagram: string;
  douban: string;
  neteaseMusic: string;
  resume: string;
  iam: string;
  name: string;
  pronounce: string;
}

export default function HomeWrapper({ t, children }: { t: I18nProps; children: ReactNode }) {
  const links: FancyLinkProps[] = [
    { label: t.blog, href: '/categories/nichijou', icon: <FaRegPenToSquare /> },
    { label: t.telegram, href: 'https://t.me/aboutzy', target: '_blank', icon: <FaTelegramPlane /> },
    { label: t.github, href: 'https://github.com/varzy', target: '_blank', icon: <FaGithub /> },
    { label: t.instagram, href: 'https://instagram.com/varzyme', target: '_blank', icon: <FaInstagram /> },
    { label: t.douban, href: 'https://www.douban.com/people/varzy/', icon: <SiDoubanread /> },
    {
      label: t.neteaseMusic,
      href: 'https://music.163.com/playlist?id=39874340&userid=45403592',
      icon: <RiNeteaseCloudMusicLine />,
    },
    { label: t.resume, href: '/resume', icon: <FaRegAddressCard /> },
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
      <LocaleToggle />
      <div className="container mx-auto max-w-4xl px-6 pt-20 leading-7 sm:px-8">
        <Row>
          <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between">
            <div className="info">
              <p className="mb-3 text-4xl font-bold">Hi,</p>
              <p className="mb-3 text-3xl font-bold">
                {t.iam}
                <strong className="inline-block italic text-indigo-600">{t.name}</strong>
                <span className="inline-block text-base font-light">&nbsp;&nbsp;/{t.pronounce}/</span>
              </p>
              <p>🧑‍💻Web Developer. 📝Blogger. 🫣INFJ.</p>
            </div>
            <div className="avatar flex justify-center md:justify-end">
              <Avatar />
            </div>
          </div>
        </Row>
        <Row title="about me">
          <div className="[&>p]:mb-3 last:[&>p]:mb-0">{children}</div>
        </Row>
        <Row title="find me">
          <div className="flex flex-wrap">
            {links.map((link, index) => (
              <div className="mb-3 basis-1/2 sm:basis-1/3 md:basis-1/4" key={index}>
                <FancyLink href={link.href} target={link.target} label={link.label} icon={link.icon} />
              </div>
            ))}
          </div>
        </Row>
      </div>
    </>
  );
}
