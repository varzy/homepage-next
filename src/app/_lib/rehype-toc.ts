import GithubSlugger from 'github-slugger';
import type { Element, Root, RootContent } from 'hast';

export interface TocItem {
  depth: number;
  id: string;
  text: string;
}

const HEADING = /^h([1-6])$/;
const TOC_MAX_DEPTH = 3;

function toText(node: RootContent | Element): string {
  if (node.type === 'text') return node.value;
  return 'children' in node ? node.children.map((c) => toText(c as RootContent)).join('') : '';
}

/** 给所有标题加 id，并把 h1–h3 收集进传入的 items 数组（unified 插件 options 即该数组）。 */
export default function rehypeToc(items: TocItem[]) {
  return (tree: Root) => {
    const slugger = new GithubSlugger();
    const walk = (node: Root | Element) => {
      for (const child of node.children) {
        if (child.type !== 'element') continue;
        const match = HEADING.exec(child.tagName);
        if (match) {
          const text = toText(child).trim();
          const id = slugger.slug(text);
          child.properties.id ??= id;
          const depth = Number(match[1]);
          if (depth <= TOC_MAX_DEPTH && text)
            items.push({ depth, id: String(child.properties.id), text });
        } else {
          walk(child);
        }
      }
    };
    walk(tree);
  };
}
