import Link from 'next/link';

export default function BuyMeACoffee() {
  return (
    <Link
      href="/sponsor"
      className="my-4 block rounded-xl border bg-[#eeedeb] p-4 transition-all duration-300 ease-in-out hover:shadow-md"
    >
      <h3 className="text-lg font-bold">☕️ Buy me a Coffee~</h3>
      <p className="mt-2">如果你喜欢我的内容，或者它们可以给你带来帮助，或许可以请我喝一杯咖啡？</p>
    </Link>
  );
}
