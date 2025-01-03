import { ReactNode } from 'react';
import PageHero, { PageHeroProps } from './PageHero';

export default function BlogPageContainer({ children, pageHero }: { children: ReactNode; pageHero?: PageHeroProps }) {
  return (
    <>
      {pageHero && <PageHero {...pageHero}></PageHero>}
      <div className="g-blog-container py-8">
        <div>{children}</div>
      </div>
    </>
  );
}
