import type { Metadata } from 'next';
import '../styles/main.css';
import { SITE_CONFIG } from '@/site.config';
import { getEmojiFavicon } from '@/utils/helpers';

// Re-SSG by 60s.
// https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#time-based-revalidation
// unit: s. 60 = 1min
// Notion images will expire after 3600s, so we must revalidate less than 1 hour.
export const revalidate = 60 * 30;

export const metadata: Metadata = {
  title: {
    default: SITE_CONFIG.title,
    template: `%s | ${SITE_CONFIG.title}`,
  },
  keywords: SITE_CONFIG.keywords,
  description: SITE_CONFIG.description,
  icons: getEmojiFavicon('👻'),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={SITE_CONFIG.lang}>
      <body>{children}</body>
    </html>
  );
}
