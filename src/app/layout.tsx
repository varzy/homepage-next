import type { Metadata } from 'next';
import '../styles/main.css';
import { SITE_CONFIG } from '@/site.config';
import { getEmojiFavicon } from '@/utils/favicon';

export const metadata: Metadata = {
  title: {
    default: SITE_CONFIG.title,
    template: `%s - ${SITE_CONFIG.title}`,
  },
  keywords: SITE_CONFIG.keywords,
  description: SITE_CONFIG.description,
  icons: getEmojiFavicon('👻'),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className="scroll-smooth focus:scroll-auto" lang={SITE_CONFIG.lang}>
      <body>
        {children}
        {/* <SpeedInsights /> */}
      </body>
    </html>
  );
}
