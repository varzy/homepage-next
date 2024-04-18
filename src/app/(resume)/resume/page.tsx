import ResumeFile from './resume.md';
import Prose from '@/app/(blog)/_components/Prose';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: `赵越的简历`
};

export default async function Resume() {
  return (
    <div className="container mx-auto max-w-3xl px-6 pb-32 pt-16">
      <Prose>{ResumeFile}</Prose>
    </div>
  );
}
