import { ReactNode } from 'react';

export default function BlogSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-12 last:mb-0">
      <h3 className="font-bold">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}
