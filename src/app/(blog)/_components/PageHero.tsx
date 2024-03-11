import { ReactNode } from 'react';

export default function PageHero(props: { title?: string; description?: string; children?: ReactNode }) {
  return (
    <div className="bg-gray-100">
      <div className="g-blog-container py-6">
        {props.title ? (
          <>
            <h1 className="text-3xl font-normal">{props.title}</h1>
            <p className="mt-2">{props.description}</p>
          </>
        ) : (
          props.children
        )}
      </div>
    </div>
  );
}
