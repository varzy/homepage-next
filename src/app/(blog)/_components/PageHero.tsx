import { ReactNode } from 'react';

export interface PageHeroProps {
  title?: string;
  after?: string | ReactNode;
  children?: ReactNode;
}

export default function PageHero({ title, after, children }: PageHeroProps) {
  return (
    <div className="g-blog-container py-10">
      {children ? (
        <>{children}</>
      ) : (
        <>
          {title && <h1 className="text-3xl font-extrabold text-black sm:text-4xl">{title}</h1>}
          {after && typeof after === 'string' ? <p className="mt-2">{after}</p> : <>{after}</>}
        </>
      )}
    </div>
  );
}
