import BlogHeader from '@/app/(blog)/_components/BlogHeader';
import BlogFooter from '@/app/(blog)/_components/BlogFooter';

export default function BlogLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="[& a]:text-red">
      <BlogHeader />
      <main>{children}</main>
      <BlogFooter />
    </div>
  );
}
