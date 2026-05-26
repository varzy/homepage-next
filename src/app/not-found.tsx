import { Metadata } from 'next';
import Link from 'next/link';
import Prose from '@/app/_components/Prose';
import { getEmojiFavicon } from '@/utils/favicon';

export const metadata: Metadata = {
  title: '404',
  icons: getEmojiFavicon('😵'),
};

export default function NotFound() {
  return (
    <div className="g-container-lefty">
      <Prose>
        <h1>404 Not Found.</h1>
        <Link href="/">Back to /</Link>
      </Prose>
    </div>
  );
}
