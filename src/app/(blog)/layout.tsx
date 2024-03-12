import BlogHeader from '@/app/(blog)/_components/BlogHeader';
import BlogFooter from '@/app/(blog)/_components/BlogFooter';

export const revalidate = 1200; // 20min..

export default function BlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <BlogHeader />
      <main>{children}</main>
      <BlogFooter />
    </>
  );
}
