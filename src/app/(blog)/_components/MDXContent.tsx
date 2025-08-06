interface MDXContentProps {
  children: React.ReactNode;
}

export default function MDXContent({ children }: MDXContentProps) {
  return (
    <article className="prose max-w-none font-normal prose-a:break-words prose-code:break-words prose-img:mx-auto prose-img:rounded-md prose-inline-code:text-rose-400 prose-inline-code:before:content-none prose-inline-code:after:content-none sm:prose-img:w-[90%]">
      {children}
    </article>
  );
}
