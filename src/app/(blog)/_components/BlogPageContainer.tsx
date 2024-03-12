import { ReactNode } from 'react';
import PageHero, { PageHeroProps } from './PageHero';

export default function BlogPageContainer({
  children,
  pageHero,
  extra,
}: {
  children: ReactNode;
  pageHero?: PageHeroProps;
  extra?: ReactNode;
}) {
  return (
    <>
      {pageHero && <PageHero {...pageHero}></PageHero>}
      <div className="g-blog-container py-6">
        <div>{children}</div>
        {extra && <div className="mt-8">{extra}</div>}
      </div>
    </>
  );
}
