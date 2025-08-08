import Link from 'next/link';

export default function HeaderSimple() {
  return (
    <header className="py-8">
      <div className="g-container">
        <Link className="text-lg font-bold italic" href="/">
          贼 歪
        </Link>
      </div>
    </header>
  );
}
