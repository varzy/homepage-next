import { getEmojiFavicon } from '@/utils/favicon';
import { Metadata } from 'next';
import Prose from '@/app/(blog)/_components/Prose';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '404',
  icons: getEmojiFavicon('😵'),
};

export default function NotFound() {
  return (
    <div className="g-lefty-container">
      <Prose>
        <h1>404 Not Found.</h1>
        <Link href="/">Back to /</Link>
      </Prose>
    </div>
  );
}
