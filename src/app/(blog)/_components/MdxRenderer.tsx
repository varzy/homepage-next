import { MDXRemote } from 'next-mdx-remote/rsc';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MdxRendererProps {
  source: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MdxCustomComponentProps = any;

const CustomLink = (props: MdxCustomComponentProps) => {
  return <a target="_blank" rel="noopener noreferrer" {...props} />;
};

const CustomPre = ({ children }: MdxCustomComponentProps) => {
  return <>{children}</>;
};

const SmartCode = ({ children, className, ...props }: MdxCustomComponentProps) => {
  const hasLanguageClass = className && /language-\w+/.test(className);

  if (hasLanguageClass) {
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : 'text';

    return (
      <SyntaxHighlighter
        language={language}
        style={prism}
        PreTag="div"
        customStyle={{ fontSize: '0.875rem' }} // 14px
        wrapLongLines
        {...props}
      >
        {/* {String(children).replace(/\n$/, '')} */}
        {children}
      </SyntaxHighlighter>
    );
  }

  return (
    <code
      className="rounded border-0 bg-gray-200 px-1 py-0.5 font-mono text-sm font-medium text-rose-500 shadow-none"
      {...props}
    >
      {children}
    </code>
  );
};

export default function MdxRenderer({ source }: MdxRendererProps) {
  return (
    <article className="prose prose-code:before:content-none prose-code:after:content-none prose-a:font-normal prose-a:text-inherit prose-a:decoration-1 prose-blockquote:[&_p]:before:content-none prose-blockquote:[&_p]:after:content-none max-w-none text-base leading-loose break-words sm:text-lg">
      <MDXRemote
        source={source}
        components={{
          code: SmartCode,
          pre: CustomPre,
          a: CustomLink,
        }}
      />
    </article>
  );
}
