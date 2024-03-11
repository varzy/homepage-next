'use client';

import ReactMarkdown from 'react-markdown';

export default function PostPage({ markdown }: { markdown: string }) {
  return (
    <article className="prose prose-sm max-w-none font-normal sm:prose-base prose-img:mx-auto prose-img:rounded-md prose-img:sm:w-4/5">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </article>
  );
}
