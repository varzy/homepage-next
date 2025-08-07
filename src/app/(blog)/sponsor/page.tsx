import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import Image from 'next/image';
import SponsorWechat from '../../../assets/sponsor_wechat.jpg';
import SponsorAlipay from '../../../assets/sponsor_alipay.jpg';
import { Metadata } from 'next';
import { getEmojiFavicon } from '@/utils/favicon';

export const metadata: Metadata = {
  title: `Buy me a Coffee`,
  icons: getEmojiFavicon('☕️'),
};

export default function Sponsor() {
  const channels = [
    { label: `微信`, qrcode: SponsorWechat },
    { label: `支付宝`, qrcode: SponsorAlipay },
  ];

  return (
    <BlogPageContainer
      pageHero={{
        title: `Buy me a Coffee`,
        after: `如果你喜欢我的内容，或者它们可以给你带来帮助，或许可以请我喝一杯咖啡☕️？`,
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {channels.map((channel, index) => (
          <div key={index}>
            <div className="text-lg">{channel.label}</div>
            <Image className="mt-2 w-full" src={channel.qrcode} alt={channel.label} />
          </div>
        ))}
      </div>
    </BlogPageContainer>
  );
}
