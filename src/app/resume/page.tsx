import ResumeFile from './resume.md';
import MdxRenderer from '@/app/(blog)/_components/MdxRenderer';
import { type Metadata } from 'next';
import PageHeader from '@/app/_components/PageHeader';

export const metadata: Metadata = {
  title: `赵越的简历`,
};

export default async function Resume() {
  return (
    <div className="pb-48">
      <PageHeader />
      <div className="g-container">
        <MdxRenderer source={ResumeFile} />
      </div>
    </div>
  );
}
