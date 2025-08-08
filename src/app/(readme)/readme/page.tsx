import MdxRenderer from '@/app/(blog)/_components/MdxRenderer';
import ReadmeFile from './readme.md';
import HeaderSimple from '@/app/_components/HeaderSimple';

export default function Readme() {
  return (
    <div className="pb-64">
      <HeaderSimple />
      <div className="g-container">
        <div className="flex gap-3.5 pt-12 pb-10">
          <div className="flex-1">
            <img src="https://cdn.sa.net/2025/08/08/rJ9UIbeghaxc52d.jpg" alt="" />
          </div>
          <div className="flex-1">
            <img src="https://cdn.sa.net/2025/08/08/Z8N2B3ObpDSTVEt.jpg" alt="" />
          </div>
        </div>

        <MdxRenderer source={ReadmeFile} />
      </div>
    </div>
  );
}
