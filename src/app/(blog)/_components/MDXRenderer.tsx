import { MDXRemote } from 'next-mdx-remote/rsc';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface MdxRendererProps {
  source: string;
}

// 自定义代码块组件
const CustomCodeBlock = ({ children, className, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  if (language) {
    return (
      <SyntaxHighlighter language={language} style={prism} PreTag="div" {...props}>
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    );
  }

  return (
    <code className="border bg-slate-200 text-rose-400 px-1" {...props}>
      {children}
    </code>
  );
};

// 自定义链接组件 - 所有链接都在新标签页打开
const CustomLink = (props: any) => {
  return <a target="_blank" rel="noopener noreferrer" {...props} />;
};

// 自定义预格式化文本组件
const CustomPre = (props: any) => {
  return <div {...props} />;
};

// MDX 组件配置
const mdxComponents = {
  code: CustomCodeBlock,
  pre: CustomPre,
  a: CustomLink,
};

export default function MdxRenderer({ source }: MdxRendererProps) {
  return (
    <article className="prose max-w-none font-normal prose-a:break-words prose-code:break-words prose-img:mx-auto prose-img:rounded-md prose-inline-code:text-rose-400 prose-inline-code:before:content-none prose-inline-code:after:content-none sm:prose-img:w-[90%]">
      <MDXRemote source={source} components={mdxComponents} />
    </article>
  );
}
