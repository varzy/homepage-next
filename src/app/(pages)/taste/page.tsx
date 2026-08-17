import { type Metadata } from 'next';
import MdxRenderer from '@/app/_components/MdxRenderer';
import { getPageWithContent } from '@/app/_lib/page-loader';
import { getAllTasteItemsWithContent, groupTasteByCategory } from '@/app/_lib/taste-loader';
import { getEmojiFavicon } from '@/utils/favicon';
import TasteGallery, { type TasteCategory } from './_components/TasteGallery';

export const metadata: Metadata = {
  title: '书影音',
  icons: getEmojiFavicon('🎬'),
};

const CATEGORIES: TasteCategory[] = [
  { name: '书', aspect: 2 / 3 },
  { name: '影', aspect: 2 / 3 },
  { name: '音', aspect: 1 },
  { name: '剧', aspect: 2 / 3 },
  { name: '动画', aspect: 2 / 3 },
  { name: '漫画', aspect: 2 / 3 },
  { name: '游戏', aspect: 2 / 3 },
  { name: '音乐剧', aspect: 2 / 3 },
  { name: '播客', aspect: 1 },
  { name: '视频', aspect: 500 / 309 },
];

export default async function Taste() {
  const page = await getPageWithContent('taste');
  const items = await getAllTasteItemsWithContent();
  const grouped = groupTasteByCategory(items);
  const groups = CATEGORIES.filter(({ name }) => grouped[name]).map(({ name, aspect }) => ({
    name,
    aspect,
    items: grouped[name].sort((a, b) => a.title.localeCompare(b.title)),
  }));

  return (
    <div>
      {page && <MdxRenderer source={page.content} />}
      <TasteGallery groups={groups} />
    </div>
  );
}
