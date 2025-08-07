import { ReactNode } from 'react';

export interface PageHeroProps {
  title?: string;
  before?: string;
  after?: string | ReactNode;
  children?: ReactNode;
}

export default function PageHero({ title, before, after, children }: PageHeroProps) {
  return (
    <div className="g-blog-container pt-8 pb-6">
      {children ? (
        <>{children}</>
      ) : (
        <>
          {before && <p className="mb-2 font-mono text-xs">{before}</p>}
          {title && <h1 className="text-2xl font-bold text-black sm:text-3xl">{title}</h1>}
          {after && typeof after === 'string' ? <p className="mt-2 text-base">{after}</p> : <>{after}</>}
        </>
      )}
    </div>
  );
}
