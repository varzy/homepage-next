import { type Metadata } from 'next';
import { notFound } from 'next/navigation';
import MdxRenderer from '@/app/_components/MdxRenderer';
import { getPageWithContent } from '@/app/_lib/blog-loader';
import { getEmojiFavicon } from '@/utils/favicon';

export const metadata: Metadata = {
  title: `赵越的简历`,
  icons: getEmojiFavicon('🔖'),
};

export default async function Resume() {
  const postWithContent = await getPageWithContent('resume');
  if (!postWithContent) notFound();

  return <MdxRenderer source={postWithContent.content} />;
}
