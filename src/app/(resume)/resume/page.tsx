import ResumeFile from './resume.md';
import Prose from '@/app/(blog)/_components/Prose';

export default async function Resume() {
  return (
    <div className="container mx-auto max-w-3xl px-6 pt-16 pb-32 font-sans">
      <Prose markdown={ResumeFile} />
    </div>
  );
}
