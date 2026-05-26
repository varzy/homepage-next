import { ReactNode } from 'react';

export interface PageHeroProps {
  title?: string;
  after?: string | ReactNode;
  children?: ReactNode;
}

export default function PageHero({ title, after, children }: PageHeroProps) {
  return (
    <div className="g-container py-10">
      {children ? (
        <>{children}</>
      ) : (
        <>
          {title && <h1 className="text-ink text-3xl font-extrabold sm:text-4xl">{title}</h1>}
          {after && <div className="mt-3">{after}</div>}
        </>
      )}
    </div>
  );
}
