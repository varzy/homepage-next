'use client';

import clsx from 'clsx';
import { useState } from 'react';
import type { TasteItemWithContent } from '@/app/_lib/taste-loader';
import TasteCard from './TasteCard';

export type TasteCategoryGroup = {
  category: string;
  items: TasteItemWithContent[];
  aspect: number;
};

const OPTIONS = [
  { value: false, label: 'Less' },
  { value: true, label: 'More' },
] as const;

export default function TasteGallery({ groups }: { groups: TasteCategoryGroup[] }) {
  const [showExtra, setShowExtra] = useState(false);

  return (
    <>
      <div className="mt-6 flex justify-end">
        <div className="text-sm">
          {OPTIONS.map((opt) => {
            const active = opt.value === showExtra;
            return (
              <a
                key={opt.label}
                type="button"
                onClick={() => setShowExtra(opt.value)}
                aria-pressed={active}
                className={clsx(
                  'underline ms-4 first:ms-0  rounded-md  hover:text-ink',
                  active ? 'text-ink' : 'text-secondary',
                )}
              >
                {opt.label}
              </a>
            );
          })}
        </div>
      </div>

      <div className="mt-12">
        {groups.map((group) => (
          <section key={group.category} className="mb-8 last:mb-0">
            <h3 className="mb-6 text-xl font-bold">{group.category}</h3>
            <div className="grid grid-cols-3 gap-x-2 gap-y-4 md:grid-cols-5 md:gap-x-3 md:gap-y-6">
              {group.items.map((item) => (
                <TasteCard
                  key={item.page_id}
                  item={item}
                  aspect={group.aspect}
                  showExtra={showExtra}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
