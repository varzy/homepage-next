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
  const page = await getPageWithContent('taste');
  const items = await getAllTasteItemsWithContent();
  const grouped = groupTasteByCategory(items);
  const categories = Object.keys(grouped).sort();

  return (
    <div>
      {page && <MdxRenderer source={page.content} />}

      <div className="mt-12">
        {categories.map((category) => (
          <section key={category} className="mb-12 last:mb-0">
            <h3 className="mb-4 font-bold">{category}</h3>
            <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-4">
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
