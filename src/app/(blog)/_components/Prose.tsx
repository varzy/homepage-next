'use client';

import ReactMarkdown from 'react-markdown';
import Image from 'next/image';
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
      <article className="prose max-w-none font-normal prose-pre:bg-[#1e1e1e] prose-img:mx-auto prose-img:cursor-pointer prose-img:rounded-md prose-img:sm:w-[90%]">
        <ReactMarkdown
          components={{
            img(props) {
              return (
                <Image
                  priority
                  src={props.src!}
                  alt={props.alt!}
                  width={960}
                  height={960}
                  onClick={() => onViewImage(props.src)}
                />
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
      <div className="popup"></div>
    </>
  );
}
