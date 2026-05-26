import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import LightboxImage from '@/app/_components/LightboxImage';
import MdxRenderer from '@/app/_components/MdxRenderer';
import { getPageWithContent } from '@/app/_lib/blog-loader';
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
          <LightboxImage src="https://cdn.sa.net/2025/08/08/rJ9UIbeghaxc52d.jpg" alt="" />
        </div>
        <div className="flex-1">
          <LightboxImage src="https://cdn.sa.net/2025/08/08/Z8N2B3ObpDSTVEt.jpg" alt="" />
        </div>
      </div>

      <MdxRenderer source={postWithContent.content} />
    </div>
  );
}
