import type { Metadata } from 'next';
import '../styles/main.css';

export const metadata: Metadata = {
  title: {
    default: `贼歪`,
    template: `%s | 贼歪`,
  },
  description: '',
  icons: '/favicon.ico',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-cn">
      <body>{children}</body>
    </html>
  );
}
