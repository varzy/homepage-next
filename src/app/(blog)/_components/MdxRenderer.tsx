import { MDXRemote } from 'next-mdx-remote/rsc';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MdxRendererProps {
  source: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomCodeBlock = ({ children, className, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  if (language) {
    return (
      <SyntaxHighlighter
        language={language}
        style={prism}
        PreTag="div"
        customStyle={{
          fontSize: '0.875rem',
        }}
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    );
  }

  return (
    <pre className="rounded bg-gray-200 p-4 text-sm">
      <code {...props}>{children}</code>
    </pre>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomInlineCode = ({ children, ...props }: any) => {
  return (
    <code className="rounded border-0 bg-gray-200 px-1 py-0.5 text-sm font-medium text-rose-400" {...props}>
      {children}
    </code>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomLink = (props: any) => {
  return <a target="_blank" rel="noopener noreferrer" {...props} />;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomPre = ({ children }: any) => {
  return <>{children}</>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SmartCode = ({ children, className, ...props }: any) => {
  const hasLanguageClass = className && /language-\w+/.test(className);

  if (hasLanguageClass) {
    return (
      <CustomCodeBlock className={className} {...props}>
        {children}
      </CustomCodeBlock>
    );
  }

  return <CustomInlineCode {...props}>{children}</CustomInlineCode>;
};

const mdxComponents = {
  code: SmartCode,
  pre: CustomPre,
  a: CustomLink,
};

export default function MdxRenderer({ source }: MdxRendererProps) {
  return (
    <article className="prose prose-a:break-words prose-img:mx-auto prose-pre:bg-transparent prose-pre:p-0 prose-code:before:content-none prose-code:after:content-none max-w-none font-normal">
      <MDXRemote source={source} components={mdxComponents} />
    </article>
  );
}
