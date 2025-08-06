import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

// 自定义代码块组件
const CodeBlock = ({ children, className, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  if (language) {
    return (
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    );
  }

  return (
    <code
      className="border bg-slate-200 text-rose-400 before:content-none after:content-none"
      {...props}
    >
      {children}
    </code>
  );
};

// MDX 组件映射
export const mdxComponents = {
  // 标题组件
  h1: (props: any) => (
    <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl" {...props} />
  ),
  h2: (props: any) => (
    <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0" {...props} />
  ),
  h3: (props: any) => (
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight" {...props} />
  ),
  h4: (props: any) => (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight" {...props} />
  ),
  h5: (props: any) => (
    <h5 className="scroll-m-20 text-lg font-semibold tracking-tight" {...props} />
  ),
  h6: (props: any) => (
    <h6 className="scroll-m-20 text-base font-semibold tracking-tight" {...props} />
  ),

  // 段落组件
  p: (props: any) => (
    <p className="leading-7 [&:not(:first-child)]:mt-6" {...props} />
  ),

  // 列表组件
  ul: (props: any) => (
    <ul className="my-6 ml-6 list-disc [&>li]:mt-2" {...props} />
  ),
  ol: (props: any) => (
    <ol className="my-6 ml-6 list-decimal [&>li]:mt-2" {...props} />
  ),
  li: (props: any) => <li {...props} />,

  // 链接组件
  a: (props: any) => (
    <a
      className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
      target={props.href?.startsWith('http') ? '_blank' : undefined}
      rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    />
  ),

  // 图片组件
  img: (props: any) => (
    <img
      className="mx-auto rounded-md sm:w-[90%]"
      alt={props.alt || ''}
      {...props}
    />
  ),

  // 代码组件
  code: CodeBlock,

  // 引用组件
  blockquote: (props: any) => (
    <blockquote className="mt-6 border-l-2 pl-6 italic" {...props} />
  ),

  // 表格组件
  table: (props: any) => (
    <div className="my-6 w-full overflow-y-auto">
      <table className="w-full" {...props} />
    </div>
  ),
  thead: (props: any) => <thead {...props} />,
  tbody: (props: any) => <tbody {...props} />,
  tr: (props: any) => (
    <tr className="m-0 border-t p-0 even:bg-muted" {...props} />
  ),
  th: (props: any) => (
    <th className="border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />
  ),
  td: (props: any) => (
    <td className="border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right" {...props} />
  ),

  // 水平线
  hr: (props: any) => <hr className="my-4 md:my-8" {...props} />,

  // 预格式化文本
  pre: (props: any) => {
    // 如果 pre 包含 code，让 code 组件处理语法高亮
    return <div {...props} />;
  },
};

interface MDXContentProps {
  children: React.ReactNode;
}

export default function MDXContent({ children }: MDXContentProps) {
  return (
    <article className="prose max-w-none font-normal prose-a:break-words prose-code:break-words prose-img:mx-auto prose-img:rounded-md prose-inline-code:text-rose-400 prose-inline-code:before:content-none prose-inline-code:after:content-none sm:prose-img:w-[90%]">
      {children}
    </article>
  );
}
