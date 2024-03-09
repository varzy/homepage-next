import { SITE_CONFIG } from '@/site.config';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';

interface PageProps {
  params: {
    category: keyof typeof SITE_CONFIG.categories;
  };
}

function BuyMeACoffee() {
  return <div className="rounded my-4 px-4 border">buy me a coffee.</div>;
}

export function generateMetadata({ params }: PageProps) {
  const categoryContext = SITE_CONFIG.categories[params.category];
  const categoryAlias = categoryContext.alias || '';

  return { title: categoryAlias };
}

export default function BlogLayout({ children, params }: Readonly<{ children: ReactNode }> & PageProps) {
  const availableCategories = Object.keys(SITE_CONFIG.categories);
  if (!availableCategories.includes(params.category)) notFound();

  return (
    <>
      {children}
      {params.category === 'tech' && <BuyMeACoffee />}
    </>
  );
}
