import { type Metadata } from 'next';
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
    </div>
  );
}
