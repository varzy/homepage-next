import ResumeFile from './resume.md';
import MDXContent from '@/app/(blog)/_components/MDXContent';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { mdxComponents } from '@/app/(blog)/_components/MDXContent';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `赵越的简历`,
};

export default async function Resume() {
  return (
    <div className="container mx-auto max-w-3xl px-6 pb-32 pt-16">
      <MDXContent>
        <MDXRemote source={ResumeFile} components={mdxComponents} />
      </MDXContent>
    </div>
  );
}
