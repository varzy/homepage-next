'use client';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

const CodeBlock = ({ language, codestring }: { language: string; codestring: string }) => {
  return (
    <SyntaxHighlighter language={language} style={vscDarkPlus} PreTag="div">
      {codestring}
    </SyntaxHighlighter>
  );
};

export default function Prose({ markdown }: { markdown: string }) {
  const onViewImage = (src?: string) => {
    console.log(src);
  };

  return (
    <>
      <article className="prose max-w-none font-normal prose-a:break-words prose-code:break-words prose-pre:bg-[#1e1e1e] prose-img:mx-auto prose-img:rounded-md prose-img:sm:w-[90%]">
        <ReactMarkdown
          components={{
            img(props) {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={props.src} alt={props.alt || ''} onClick={() => onViewImage(props.src)} />
              );
            },
            code({ inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '');
              return !inline && match ? (
                <CodeBlock codestring={String(children).replace(/\n$/, '')} language={match[1]} />
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {markdown}
        </ReactMarkdown>
      </article>
    </>
  );
}
