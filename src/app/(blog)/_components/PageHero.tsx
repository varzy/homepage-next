import { ReactNode } from 'react';

export interface PageHeroProps {
  title?: string;
  before?: string;
  after?: string | ReactNode;
  children?: ReactNode;
}

export default function PageHero({ title, before, after, children }: PageHeroProps) {
  return (
    <div className="bg-[#f1f1f1]">
      <div className="g-blog-container py-6">
        {children ? (
          <>{children}</>
        ) : (
          <>
            {before && <p className="mb-2 text-xs">{before}</p>}
            {title && <h1 className="text-xl font-normal sm:text-2xl">{title}</h1>}
            {after && typeof after === 'string' ? <p className="mt-2 text-base">{after}</p> : <>{after}</>}
          </>
        )}
      </div>
    </div>
  );
}
