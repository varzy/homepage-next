import { Metadata } from 'next';
import LightboxImage from '@/app/_components/LightboxImage';
import Prose from '@/app/_components/Prose';
import { getEmojiFavicon } from '@/utils/favicon';

export const metadata: Metadata = {
  title: `Buy me a Coffee`,
  icons: getEmojiFavicon('☕️'),
};

export default async function Sponsor() {
  return (
    <Prose>
      <h1>Buy me a Coffee</h1>
      <p>如果你喜欢我的内容，或者它们给你带来帮助，或许可以请我喝一杯咖啡。</p>
      <div className="flex justify-center">
        <LightboxImage
          className="w-2/3"
          src="https://cdn.sa.net/2025/09/05/wFI1csOjDp8A96f.jpg"
          alt="zy 的支付宝赞赏码"
        />
      </div>
    </Prose>
  );
}
