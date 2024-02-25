import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: `zy's Blog`,
    template: `%s | zy's Blog`,
  },
  description: 'hi',
  icons: '/favicon.ico',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-cn">
      <body>{children}</body>
    </html>
  );
}
