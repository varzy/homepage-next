import { SITE_CONFIG } from '@/site.config';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { Metadata } from 'next';
import { getEmojiFavicon } from '@/utils/favicon';

interface PageProps {
  params: Promise<{
    category: keyof typeof SITE_CONFIG.categories;
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryContext = SITE_CONFIG.categories[category];
  const categoryAlias = categoryContext.alias || '';

  return { title: categoryAlias, icons: getEmojiFavicon(categoryContext.favicon) };
}

export default async function BlogLayout({ children, params }: Readonly<{ children: ReactNode }> & PageProps) {
  const { category } = await params;
  const availableCategories = Object.keys(SITE_CONFIG.categories);
  if (!availableCategories.includes(category)) notFound();

  return <>{children}</>;
}
