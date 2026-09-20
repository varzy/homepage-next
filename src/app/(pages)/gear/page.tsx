import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import MdxRenderer from '@/app/_components/MdxRenderer';
import { getPageWithContent } from '@/app/_lib/page-loader';
import { getEmojiFavicon } from '@/utils/favicon';

export const metadata: Metadata = {
  title: `Gear`,
  icons: getEmojiFavicon('⚙️'),
};

export default async function Readme() {
  const postWithContent = await getPageWithContent('gear');
  if (!postWithContent) notFound();

  return <MdxRenderer source={postWithContent.content} />;
}
