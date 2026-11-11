import type { Paragraph, RichTextSnippet } from './notion.ts';

const MARKDOWN_V2_ESCAPE_REGEX = /([_*[\]()~`>#+\-=|{}.!\\])/g;
const LINK_ESCAPE_REGEX = /([)\\])/g;
const CODE_ESCAPE_REGEX = /([`\\])/g;

export function escapeMarkdownV2(text: string): string {
  return text.replace(MARKDOWN_V2_ESCAPE_REGEX, '\\$1');
}

function escapeMarkdownLinkUrl(url: string): string {
  return url.replace(LINK_ESCAPE_REGEX, '\\$1');
}

export interface MessageMeta {
  tags: string[];
  withTitle: boolean;
  title: string;
  titleUrl: string | null;
}

interface MessageSnippet {
  plainText: string;
  annotations?: Partial<RichTextSnippet['annotations']>;
  href?: string | null;
}

interface FormattedMessage {
  markdown: string;
  visibleLength: number;
}

export function convertSnippet({ plainText, annotations = {}, href }: MessageSnippet): string {
  if (annotations.code) {
    // Telegram 行内代码不能与其他样式或链接嵌套。
    return `\`${plainText.replace(CODE_ESCAPE_REGEX, '\\$1')}\``;
  }

  let text = escapeMarkdownV2(plainText);
  if (annotations.strikethrough) {
    text = `~${text}~`;
  }
  if (annotations.italic) {
    text = `_${text}_`;
  }
  if (annotations.underline) {
    // 避免 MarkdownV2 把斜体和下划线的结束标记优先解析为 __。
    text = `__${text}${annotations.italic ? '**' : ''}__`;
  }
  if (annotations.bold) {
    text = `*${text}*`;
  }
  if (href) {
    text = `[${text}](${escapeMarkdownLinkUrl(href)})`;
  }

  return text;
}

function toHashtag(tag: string): string {
  const normalized = tag.trim().replace(/^#+/, '').replace(/\s+/g, '');
  return normalized ? `#${normalized}` : '';
}

export function formatMessage(paragraphs: Paragraph[], meta: MessageMeta): FormattedMessage {
  const sections: MessageSnippet[][] = [
    [{ plainText: meta.tags.map(toHashtag).filter(Boolean).join(' ') }],
    meta.withTitle
      ? [{ plainText: meta.title, annotations: { bold: true }, href: meta.titleUrl }]
      : [],
    ...paragraphs,
  ];
  const nonEmptySections = sections
    .map((section) => section.filter((snippet) => snippet.plainText.length > 0))
    .filter((section) => section.length > 0);
  const text = nonEmptySections
    .map((section) => section.map((snippet) => snippet.plainText).join(''))
    .join('\n\n');

  return {
    markdown: nonEmptySections.map((section) => section.map(convertSnippet).join('')).join('\n\n'),
    visibleLength: Array.from(text).length,
  };
}

export function validateMessage({ visibleLength }: FormattedMessage, hasImages: boolean): void {
  const maxLength = hasImages ? 1024 : 4096;
  const field = hasImages ? 'caption' : 'text';

  if (visibleLength > maxLength) {
    throw new Error(`Telegram ${field} 超长：当前 ${visibleLength}，上限 ${maxLength}`);
  }
}
