import type { Element, Root } from 'hast';
import { describe, expect, it } from 'vitest';
import rehypeToc, { type TocItem } from '../src/app/_lib/rehype-toc';

const h = (tagName: string, ...children: Root['children']): Element => ({
  type: 'element',
  tagName,
  properties: {},
  children: children as Element['children'],
});
const t = (value: string) => ({ type: 'text' as const, value });

describe('rehypeToc', () => {
  it('slugs headings like rehype-slug and collects h1–h3', () => {
    const tree: Root = {
      type: 'root',
      children: [
        h('h2', t('Hello '), h('code', t('World'))),
        h('p', t('body')),
        h('h3', t('安装 Docker')),
        h('h2', t('Hello World')),
        h('h4', t('Deep')),
        h('pre', h('code', t('# not a heading'))),
      ],
    };
    const items: TocItem[] = [];
    rehypeToc(items)(tree);

    expect(items).toEqual([
      { depth: 2, id: 'hello-world', text: 'Hello World' },
      { depth: 3, id: '安装-docker', text: '安装 Docker' },
      { depth: 2, id: 'hello-world-1', text: 'Hello World' },
    ]);
    expect((tree.children[4] as Element).properties.id).toBe('deep');
  });
});
