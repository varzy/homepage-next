import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';

type MDXComponents = Record<string, React.ComponentType<any>>;

// 自定义代码块组件
const CustomCodeBlock = ({ children, className, ...props }: any) => {
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

// 自定义链接组件 - 所有链接都在新标签页打开
const CustomLink = (props: any) => {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  );
};

// 自定义预格式化文本组件
const CustomPre = (props: any) => {
  return <div {...props} />;
};

// 全局 MDX 组件配置 - 在这里集中管理所有自定义组件
const globalMdxComponents = {
  // 代码高亮组件
  code: CustomCodeBlock,

  // 预格式化文本组件
  pre: CustomPre,

  // 自定义链接组件，所有链接都在新标签页打开
  a: CustomLink,

  // 如果需要添加更多自定义组件，可以在这里扩展
  // 例如：
  // CustomAlert: (props: any) => <div className="alert" {...props} />,
  // CustomButton: (props: any) => <button className="btn" {...props} />,
};

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...globalMdxComponents,
    ...components,
  };
}
