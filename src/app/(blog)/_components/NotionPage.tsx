'use client';

import ReactMarkdown from 'react-markdown';

export default function PostPage({ markdown }: { markdown: string }) {
  return (
    <article className="prose max-w-none font-normal prose-img:mx-auto prose-img:rounded-md prose-img:sm:w-[90%]">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </article>
  );
}
