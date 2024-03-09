import Link from 'next/link';
import styles from './layout.module.css';
import cls from 'classnames';

export default function BlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <header className={cls('sticky', styles.header)}>
        <div className="page_container">
          <Link href="/">LOGO</Link>
        </div>
      </header>
      <main className="py-4">
        <div className="page_container">{children}</div>
      </main>
      <footer>
        <div className="page_container">
          <hr className="border-gray-200" />
          <div className="py-4 text-sm leading-6">&copy; 2015 - {new Date().getFullYear()}</div>
        </div>
      </footer>
    </>
  );
}
