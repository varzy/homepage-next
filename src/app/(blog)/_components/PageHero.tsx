import { ReactNode } from 'react';

export default function PageHero({
  title,
  before,
  after,
  children,
}: {
  title?: string;
  before?: string;
  after?: string | ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="bg-[#EEEDEB]">
      <div className="g-blog-container py-6">
        {children ? (
          <>{children}</>
        ) : (
          <>
            {before && <p className="mb-2 text-xs">{before}</p>}
            {title && <h1 className="text-2xl font-normal">{title}</h1>}
            {after && typeof after === 'string' ? <p className="mt-2 text-base">{after}</p> : <>{after}</>}
          </>
        )}
      </div>
    </div>
  );
}
