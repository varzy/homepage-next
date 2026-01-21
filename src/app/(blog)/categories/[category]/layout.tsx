import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import { SITE_CONFIG } from '@/site.config';
import { getEmojiFavicon } from '@/utils/favicon';

interface PageProps {
  params: Promise<{
    category: string;
  }>;
}

function isCategoryKey(value: string): value is keyof typeof SITE_CONFIG.categories {
  return value in SITE_CONFIG.categories;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  if (!isCategoryKey(category)) return {};

  const categoryContext = SITE_CONFIG.categories[category];
  const categoryAlias = categoryContext.alias || '';

  return { title: categoryAlias, icons: getEmojiFavicon(categoryContext.favicon) };
}

export default async function BlogLayout({
  children,
  params,
}: Readonly<{ children: ReactNode }> & PageProps) {
  const { category } = await params;
  if (!isCategoryKey(category)) notFound();

  return <>{children}</>;
}
