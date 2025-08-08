import ResumeFile from './resume.md';
import MdxRenderer from '@/app/(blog)/_components/MdxRenderer';
import { Metadata } from 'next';
import HeaderSimple from '@/app/_components/HeaderSimple';

export const metadata: Metadata = {
  title: `赵越的简历`,
};

export default async function Resume() {
  return (
    <div className="pb-64">
      <HeaderSimple />
      <div className="g-container">
        <MdxRenderer source={ResumeFile} />
      </div>
    </div>
  );
}
