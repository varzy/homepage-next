import { MDXRemote } from 'next-mdx-remote/rsc';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MdxRendererProps {
  source: string;
}

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
    <pre className="bg-gray-200 p-4 rounded text-sm">
      <code {...props}>{children}</code>
    </pre>
  );
};

const CustomInlineCode = ({ children, ...props }: any) => {
  return (
    <code className="bg-gray-200 text-rose-400 px-1 py-0.5 rounded text-sm font-medium border-0" {...props}>
      {children}
    </code>
  );
};

const CustomLink = (props: any) => {
  return <a target="_blank" rel="noopener noreferrer" {...props} />;
};

const CustomPre = ({ children, ...props }: any) => {
  return <>{children}</>;
};

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
    <article className="prose max-w-none font-normal prose-a:break-words prose-img:mx-auto prose-img:rounded-md prose-pre:bg-transparent prose-pre:p-0 prose-code:before:content-none prose-code:after:content-none sm:prose-img:w-[90%]">
      <MDXRemote source={source} components={mdxComponents} />
    </article>
  );
}
