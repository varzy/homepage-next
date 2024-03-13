import { SITE_CONFIG } from '@/site.config';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { Metadata } from 'next';
import { getEmojiFavicon } from '@/utils/favicon';

interface PageProps {
  params: {
    category: keyof typeof SITE_CONFIG.categories;
  };
}

export function generateMetadata({ params }: PageProps): Metadata {
  const categoryContext = SITE_CONFIG.categories[params.category];
  const categoryAlias = categoryContext.alias || '';

  return { title: categoryAlias, icons: getEmojiFavicon(categoryContext.favicon) };
}

export default function BlogLayout({ children, params }: Readonly<{ children: ReactNode }> & PageProps) {
  const availableCategories = Object.keys(SITE_CONFIG.categories);
  if (!availableCategories.includes(params.category)) notFound();

  return <>{children}</>;
}
