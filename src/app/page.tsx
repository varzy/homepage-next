import Link from 'next/link';

export default function Home() {
  const links = [
    { label: '我', alias: 'README', href: '/readme' },
    { label: '文章', alias: 'Blog', href: '/blog' },
    {
      label: '贼歪说',
      alias: 'Kotoba',
      href: '/kotoba',
    },
    {
      label: '随手拍',
      alias: 'Instagram',
      href: 'https://instagram.com/varzyme',
      target: '_blank',
    },
    {
      label: '书影音',
      alias: 'Taste',
      href: '/taste',
    },
    {
      label: '器用',
      alias: 'Gear',
      href: '/gear',
    },
    {
      label: '代码库',
      alias: 'Github',
      href: 'https://github.com/varzy',
      target: '_blank',
    },
    {
      label: '往来',
      alias: 'Friends',
      href: '/friends',
    },
  ];

  return (
    <main className="container px-4 pt-32 pb-20 leading-8 tracking-wider sm:pl-12 md:pl-16 lg:pl-32 xl:pl-48 2xl:pl-80">
      {/* Heading */}
      <div className="flex items-end text-5xl font-bold">
        <h1 className="italic">贼歪</h1>
      </div>
      <h2 className="mt-3">🧑‍💻Developer. 📝Blogger. 🫣INFJ.</h2>

      {/* Links */}
      <nav aria-label="首页菜单">
        <ul className="mt-12 space-y-2.5">
          {links.map((link, index) => (
            <li key={index}>
              <span>/&nbsp;</span>
              <Link
                href={link.href}
                target={link.target}
                className="inline-flex items-center hover:underline"
              >
                <span className="text-ink w-22 font-bold tracking-widest">{link.label}</span>
                <span className="text-secondary font-normal">{link.alias}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
