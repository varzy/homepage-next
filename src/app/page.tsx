import Link from 'next/link';

export default function Home() {
  const links = [
    { label: '我', alias: 'README', href: '/readme' },
    { label: '文章', alias: 'Blog', href: '/blog' },
    { label: '贼歪说', alias: 'Telegram', href: 'https://t.me/aboutzy', target: '_blank' },
    { label: '随手拍', alias: 'Instagram', href: 'https://instagram.com/varzyme', target: '_blank' },
    { label: '书影音', alias: 'Douban', href: 'https://www.douban.com/people/varzy/', target: '_blank' },
    {
      label: '歌单',
      alias: 'NeteaseMusic',
      href: 'https://music.163.com/playlist?id=39874340&userid=45403592',
      target: '_blank',
    },
    { label: '代码库', alias: 'Github', href: 'https://github.com/varzy', target: '_blank' },
  ];

  return (
    <div className="container px-5 pt-36 pb-24 leading-8 tracking-wider sm:pl-12 md:pl-24 lg:pl-36 xl:pl-48">
      {/* Heading */}
      <div className="flex items-end text-5xl font-bold">
        <h1 className="italic">贼歪</h1>
        <strong className="text-secondary ms-4 text-base font-light">/zeɪ &apos;waɪ/</strong>
      </div>
      <h2 className="mt-3">🧑‍💻Web Developer. 📝Blogger. 🫣INFJ.</h2>

      {/* Links */}
      <nav>
        <ul className="mt-12 space-y-2.5">
          {links.map((link, index) => (
            <li key={index}>
              <span>/&nbsp;</span>
              <Link href={link.href} target={link.target} className="inline-flex items-center hover:underline">
                <span className="w-22 font-bold tracking-widest text-black">{link.label}</span>
                <span className="text-secondary font-normal">{link.alias}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
