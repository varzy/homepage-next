import type { Metadata } from 'next';
import '../styles/main.css';
import { SITE_CONFIG } from '@/site.config';
import { getEmojiFavicon } from '@/utils/favicon';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Noto_Serif_SC } from 'next/font/google';
import clsx from 'clsx';

export const metadata: Metadata = {
  title: {
    default: SITE_CONFIG.title,
    template: `%s - ${SITE_CONFIG.title}`,
  },
  keywords: SITE_CONFIG.keywords,
  description: SITE_CONFIG.description,
  icons: getEmojiFavicon('👻'),
  alternates: {
    types: {
      'application/rss+xml': `${SITE_CONFIG.siteUrl}/rss.xml`,
    },
  },
  other: {
    rss: `${SITE_CONFIG.siteUrl}/rss.xml`,
  },
};

const notoSerif = Noto_Serif_SC({
  subsets: ['latin'],
  fallback: ['ui-serif', 'system-ui', 'Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
});

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang={SITE_CONFIG.lang}
      className={clsx(notoSerif.className, 'scroll-smooth font-serif text-gray-900 antialiased focus:scroll-auto')}
    >
      <body className="bg-[#f7f7f7] tracking-wide">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
