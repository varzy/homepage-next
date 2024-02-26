import Link from 'next/link';

export default function Home() {
  const links = [
    { label: '日常', href: '/categories/nichijou' },
    { label: '技术', href: '/categories/tech' },
    { label: '简历', href: '/resume' },
    { label: 'Github', href: 'https://github.com/varzy', target: '_blank' },
    { label: 'Instagram', href: 'https://instagram.com/varzyme', target: '_blank' },
  ];

  return (
    <div className="flex align-middle justify-center p-4 w-full min-h-screen bg-gray-100">
      <div className="container bg-white  p-4">
        {links.map((link, index) => (
          <div className="link" key={index}>
            <Link className="hover:text-blue-500 transition" href={link.href} target={link.target}>
              {link.label}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
