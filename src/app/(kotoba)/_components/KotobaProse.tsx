export default function KotobaProse({ children }: { children: React.ReactNode }) {
  return (
    <article className="g-with-prose prose-p:my-3 prose-ul:my-3 prose-ol:my-3 prose-blockquote:my-3 last:prose-p:mb-0 text-paragraph">
      {children}
    </article>
  );
}
