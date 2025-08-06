import { mdxComponents } from './app/(blog)/_components/MDXContent';

type MDXComponents = Record<string, React.ComponentType<any>>;

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...mdxComponents,
    ...components,
  };
}
