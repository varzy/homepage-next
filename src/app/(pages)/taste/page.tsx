import { type Metadata } from 'next';
import MdxRenderer from '@/app/_components/MdxRenderer';
import { getPageWithContent } from '@/app/_lib/page-loader';
import { getAllTasteItemsWithContent, groupTasteByCategory } from '@/app/_lib/taste-loader';
import { getEmojiFavicon } from '@/utils/favicon';
import TasteGallery from './_components/TasteGallery';

export const metadata: Metadata = {
  title: '书影音',
  icons: getEmojiFavicon('🎬'),
};

export default async function Taste() {
  const CATEGORY_ORDER = ['书', '影', '音', '剧', '动画', '漫画', '游戏', '音乐剧'];

  const page = await getPageWithContent('taste');
  const items = await getAllTasteItemsWithContent();
  const grouped = groupTasteByCategory(items);
  const groups = CATEGORY_ORDER.filter((category) => grouped[category]).map((category) => ({
    category,
    items: grouped[category],
    aspect: category === '音' ? 1 : 618 / 1000,
  }));

  return (
    <div>
      {page && <MdxRenderer source={page.content} />}
      <TasteGallery groups={groups} />
    </div>
  );
}
