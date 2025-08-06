import ResumeFile from './resume.md';
import MdxRenderer from '@/app/(blog)/_components/MdxRenderer';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `赵越的简历`,
};

export default async function Resume() {
  return (
    <div className="container mx-auto max-w-3xl px-6 pt-16 pb-32">
      <MdxRenderer source={ResumeFile} />
    </div>
  );
}
