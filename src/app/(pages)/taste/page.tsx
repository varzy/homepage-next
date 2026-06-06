import { type Metadata } from 'next';
import MdxRenderer from '@/app/_components/MdxRenderer';
import { getPageWithContent } from '@/app/_lib/page-loader';
import { getAllTasteItemsWithContent, groupTasteByCategory } from '@/app/_lib/taste-loader';
import { getEmojiFavicon } from '@/utils/favicon';
import TasteCard from './_components/TasteCard';

export const metadata: Metadata = {
  title: '书影音',
  icons: getEmojiFavicon('🎬'),
};

export default async function Taste() {
  const CATEGORY_ORDER = ['书', '影', '音', '剧', '动画', '漫画', '游戏', '音乐剧', '播客'];

  const page = await getPageWithContent('taste');
  const items = await getAllTasteItemsWithContent();
  const grouped = groupTasteByCategory(items);
  const categories = CATEGORY_ORDER.filter((category) => grouped[category]);

  return (
    <div>
      {page && <MdxRenderer source={page.content} />}

      <div className="mt-12">
        {categories.map((category) => (
          <section key={category} className="mb-8 last:mb-0">
            <h3 className="mb-4 text-lg font-bold">{category}</h3>
            <div className="grid grid-cols-4 gap-3 md:grid-cols-5 md:gap-4">
              {grouped[category].map((item) => (
                <TasteCard key={item.page_id} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
