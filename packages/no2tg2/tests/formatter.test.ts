import { describe, expect, it } from 'vitest';
import {
  convertSnippet,
  escapeMarkdownV2,
  formatMessage,
  validateMessage,
} from '../src/formatter.js';
import type { RichTextSnippet } from '../src/notion.js';

function createSnippet(partial: Partial<RichTextSnippet>): RichTextSnippet {
  return {
    plainText: partial.plainText ?? '',
    annotations: {
      bold: partial.annotations?.bold ?? false,
      italic: partial.annotations?.italic ?? false,
      strikethrough: partial.annotations?.strikethrough ?? false,
      underline: partial.annotations?.underline ?? false,
      code: partial.annotations?.code ?? false,
    },
    href: partial.href ?? null,
  };
}

const bodyOnly = { tags: [], withTitle: false, title: '', titleUrl: null };

describe('escapeMarkdownV2', () => {
  it('转义 Telegram MarkdownV2 特殊字符', () => {
    expect(escapeMarkdownV2('_*[]()~`>#+-=|{}.!\\')).toBe(
      '\\_\\*\\[\\]\\(\\)\\~\\`\\>\\#\\+\\-\\=\\|\\{\\}\\.\\!\\\\',
    );
  });
});

describe('convertSnippet', () => {
  it('先转义文本再包裹格式并处理链接', () => {
    const snippet = createSnippet({
      plainText: '点击(这里)',
      annotations: {
        bold: true,
        italic: true,
        strikethrough: false,
        underline: false,
        code: false,
      },
      href: 'https://example.com/path?a=1)',
    });

    expect(convertSnippet(snippet)).toBe('[*_点击\\(这里\\)_*](https://example.com/path?a=1\\))');
  });

  it('行内代码优先，且只转义反引号和反斜线', () => {
    const snippet = createSnippet({
      plainText: 'a_[b]. `c` \\d',
      annotations: { bold: true, italic: true, strikethrough: true, underline: true, code: true },
      href: 'https://example.com',
    });

    expect(convertSnippet(snippet)).toBe('`a_[b]. \\`c\\` \\\\d`');
  });

  it('斜体和下划线叠加时隔开结束标记', () => {
    expect(
      convertSnippet({ plainText: '文本', annotations: { italic: true, underline: true } }),
    ).toBe('___文本_**__');
  });
});

describe('formatMessage', () => {
  it('按 Tags + 标题 + 正文拼接消息', () => {
    const paragraphs = [
      [
        createSnippet({
          plainText: '第一段',
          annotations: {
            bold: true,
            italic: false,
            strikethrough: false,
            underline: false,
            code: false,
          },
        }),
      ],
      [createSnippet({ plainText: '第二段' })],
    ];

    expect(
      formatMessage(paragraphs, {
        tags: [' #标签 1 ', '标签2', ' # '],
        withTitle: true,
        title: '这是(标题)',
        titleUrl: 'https://example.com/path?a=1)',
      }),
    ).toEqual({
      markdown:
        '\\#标签1 \\#标签2\n\n[*这是\\(标题\\)*](https://example.com/path?a=1\\))\n\n*第一段*\n\n第二段',
      visibleLength: '#标签1 #标签2\n\n这是(标题)\n\n第一段\n\n第二段'.length,
    });
  });

  it('无标签且不带标题时仅输出正文', () => {
    const paragraphs = [[createSnippet({ plainText: '仅正文' })]];

    expect(
      formatMessage(paragraphs, {
        tags: [],
        withTitle: false,
        title: '不会显示',
        titleUrl: 'https://example.com',
      }),
    ).toEqual({ markdown: '仅正文', visibleLength: 3 });
  });
});

describe('validateMessage', () => {
  it('caption 长度排除 MarkdownV2 转义和链接地址', () => {
    const snippet = createSnippet({
      plainText: 'a.'.repeat(300),
      href: `https://example.com/${'a'.repeat(200)}`,
    });
    const message = formatMessage([[snippet]], bodyOnly);

    expect(message.markdown.length).toBeGreaterThan(1024);
    expect(message.visibleLength).toBe(600);
    expect(() => validateMessage(message, true)).not.toThrow();
  });

  it.each([
    ['text', 4096, false],
    ['caption', 1024, true],
  ])('%s 按 Unicode 码点校验 %i 字符的上限', (field, limit, hasImages) => {
    const snippet = createSnippet({ plainText: '😀'.repeat(limit) });
    const boundary = formatMessage([[snippet]], bodyOnly);
    expect(boundary.visibleLength).toBe(limit);
    expect(() => validateMessage(boundary, hasImages)).not.toThrow();

    const tooLong = formatMessage([[snippet, createSnippet({ plainText: 'a' })]], bodyOnly);
    expect(() => validateMessage(tooLong, hasImages)).toThrow(`Telegram ${field} 超长`);
  });
});
