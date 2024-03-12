import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import Image from 'next/image';
import SponsorWechat from '../../../assets/sponsor_wechat.png';
import SponsorAlipay from '../../../assets/sponsor_alipay.png';

export default function Sponsor() {
  return (
    <BlogPageContainer
      pageHero={{
        title: `☕️ Buy me a Coffee~`,
        after: `如果你喜欢我的内容，或者它们可以给你带来帮助，或许可以请我喝一杯咖啡？`,
      }}
    >
      <div className="">
        <div className="mt-2 text-lg ">微信</div>
        <Image className="mt-2 w-full sm:w-1/2" src={SponsorWechat} alt="微信"></Image>
      </div>
      <div className="mt-5">
        <div className="text-lg ">支付宝</div>
        <Image className="mt-2 w-full sm:w-1/2" src={SponsorAlipay} alt="支付宝"></Image>
      </div>
    </BlogPageContainer>
  );
}
