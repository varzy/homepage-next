import Link from 'next/link';

export type HeaderLink = {
  label: string;
  href: string;
  target?: '_self' | '_blank';
};

export default function SiteHeader({ links = [] }: { links?: HeaderLink[] }) {
  return (
    <header className="py-8">
      <div className="g-container">
        <div className="flex items-center justify-between">
          <Link className="text-lg font-bold tracking-wider italic" href="/">
            贼歪
          </Link>
          <nav aria-label="主导航">
            <ul className="menu align-center flex gap-4">
              {links.map((link, index) => (
                <li key={index}>
                  <Link
                    className="hover:underline"
                    href={link.href}
                    target={link.target ?? '_self'}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}
