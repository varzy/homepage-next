export default function Prose({ children }: { children: React.ReactNode }) {
  return (
    <article className="prose prose-code:before:content-none prose-code:after:content-none prose-a:font-normal prose-a:text-inherit prose-a:decoration-1 prose-blockquote:[&_p]:before:content-none prose-blockquote:[&_p]:after:content-none max-w-none text-base leading-loose break-words sm:text-lg">
      {children}
    </article>
  );
}
