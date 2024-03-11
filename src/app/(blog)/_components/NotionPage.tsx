'use client';

import ReactMarkdown from 'react-markdown';

export default function PostPage({ markdown }: { markdown: string }) {
  return (
    <div className="post_page markdown-body">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
}
