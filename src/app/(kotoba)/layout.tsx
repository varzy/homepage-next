import Link from 'next/link';
import BlogFooter from '@/app/(blog)/_components/BlogFooter';

function KotobaHeader() {
  return (
    <header className="py-8">
      <div className="g-container">
        <Link className="text-lg font-bold tracking-wider italic" href="/">
          贼歪
        </Link>
      </div>
    </header>
  );
}

export default function KotobaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <KotobaHeader />
      <main>{children}</main>
      <BlogFooter />
    </div>
  );
}
