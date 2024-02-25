import Link from 'next/link';

export default function Home() {
  const links = [
    { label: '生活', href: '/life' },
    { label: '技术', href: '/tech' },
    { label: '简历', href: '/resume' },
    { label: 'Github', href: 'https://github.com/varzy', target: '_blank' },
    { label: 'Instagram', href: 'https://instagram.com/varzyme', target: '_blank' },
  ];

  return (
    <div>
      {links.map((link, index) => (
        <div className="link" key={index}>
          <Link className="hover:text-red-600 transition" href={link.href} target={link.target}>
            {link.label}
          </Link>
        </div>
      ))}
    </div>
  );
}
