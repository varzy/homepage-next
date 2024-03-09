import { ReactNode } from 'react';

export default function PageHero(props: { title?: string; description?: string; children?: ReactNode }) {
  return (
    <div className="py-6 bg-gray-100">
      <div className="g-content-container">
        {props.title ? (
          <>
            <h1 className="text-3xl">{props.title}</h1>
            <h2>{props.description}</h2>
          </>
        ) : (
          props.children
        )}
      </div>
    </div>
  );
}
