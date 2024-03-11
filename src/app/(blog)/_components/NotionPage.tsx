'use client';

import ReactMarkdown from 'react-markdown';

export default function PostPage({ markdown }: { markdown: string }) {
  return (
    <article className="prose max-w-none font-normal prose-img:mx-auto prose-img:w-4/5 prose-img:rounded-md">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </article>
  );
}
