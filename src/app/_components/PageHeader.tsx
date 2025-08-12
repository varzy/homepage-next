import Link from 'next/link';

export default function PageHeader({ children }: { children: React.ReactNode }) {
  return (
    <header className="py-8">
      <div className="g-container">
        <div className="flex items-center justify-between">
          <Link className="text-lg font-bold italic" href="/">
            贼 歪
          </Link>
          <div>{children}</div>
        </div>
      </div>
    </header>
  );
}
