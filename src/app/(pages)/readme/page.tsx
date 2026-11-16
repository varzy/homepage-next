import { type Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LightboxImage from '@/app/_components/LightboxImage';
import MdxRenderer from '@/app/_components/MdxRenderer';
import { getPageWithContent } from '@/app/_lib/page-loader';
import { getEmojiFavicon } from '@/utils/favicon';

export const metadata: Metadata = {
  title: `README`,
  icons: getEmojiFavicon('❤️'),
};

export default async function Readme() {
  const postWithContent = await getPageWithContent('readme');
  if (!postWithContent) notFound();

  const badges = [
    {
      icon: 'https://cdn.varzy.me/static/Written-By-a-Human-Not-By-AI-Badge-white.svg',
      href: 'https://notbyai.fyi/',
      alt: 'not-by-ai',
    },
    {
      icon: 'https://cdn.varzy.me/static/by-nc-sa-icon.svg',
      href: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans',
      alt: 'cc-by-nc-sa-icon',
    },
  ];

  return (
    <div>
      <div className="flex items-end gap-3.5 pt-12 pb-10">
        <div className="flex-1">
          <LightboxImage src="https://cdn.varzy.me/static/selfie1.jpg" alt="selfie 1" />
        </div>
        <div className="flex-1">
          <LightboxImage src="https://cdn.varzy.me/static/selfie2.jpg" alt="selfie 2" />
        </div>
      </div>

      <MdxRenderer source={postWithContent.content} />

      <div className="flex items-center gap-3.5 py-2">
        {badges.map((badge) => (
          <Link key={badge.icon} target="_blank" href={badge.href}>
            <img className="h-9" src={badge.icon} alt={badge.alt} />
          </Link>
        ))}
      </div>
    </div>
  );
}
