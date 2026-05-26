import { MDXRemote } from 'next-mdx-remote/rsc';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import LightboxImage from '@/app/_components/LightboxImage';
import Prose from './Prose';

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
    const sharedProps = {
      language,
      PreTag: 'div' as const,
      customStyle: { fontSize: '0.95rem' },
      wrapLongLines: true,
      ...props,
    };

    return (
      <>
        <div className="dark:hidden">
          <SyntaxHighlighter style={oneLight} {...sharedProps}>
            {children}
          </SyntaxHighlighter>
        </div>
        <div className="hidden dark:block">
          <SyntaxHighlighter style={oneDark} {...sharedProps}>
            {children}
          </SyntaxHighlighter>
        </div>
      </>
    );
  }

  return (
    <code
      className="bg-code-bg text-code-fg rounded border-0 px-1 py-0.5 font-mono text-sm font-medium shadow-none"
      {...props}
    >
      {children}
    </code>
  );
};

export default function MdxRenderer({ source }: MdxRendererProps) {
  return (
    <Prose>
      <MDXRemote
        source={source}
        components={{
          code: SmartCode,
          pre: CustomPre,
          a: CustomLink,
          img: LightboxImage,
        }}
      />
    </Prose>
  );
}
