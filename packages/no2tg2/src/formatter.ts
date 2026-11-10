import type { Paragraph, RichTextSnippet } from './notion.ts';

const MARKDOWN_V2_ESCAPE_REGEX = /([_*[\]()~`>#+\-=|{}.!\\])/g;
const LINK_ESCAPE_REGEX = /([)\\])/g;

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

export function convertSnippet(snippet: RichTextSnippet): string {
  let text = escapeMarkdownV2(snippet.plainText);

  if (snippet.annotations.code) {
    text = `\`${text}\``;
  }
  if (snippet.annotations.strikethrough) {
    text = `~${text}~`;
  }
  if (snippet.annotations.italic) {
    text = `_${text}_`;
  }
  if (snippet.annotations.underline) {
    text = `__${text}__`;
  }
  if (snippet.annotations.bold) {
    text = `*${text}*`;
  }
  if (snippet.href) {
    text = `[${text}](${escapeMarkdownLinkUrl(snippet.href)})`;
  }

  return text;
}

export function convertParagraph(paragraph: Paragraph): string {
  return paragraph.map(convertSnippet).join('');
}

function toHashtag(tag: string): string | null {
  const normalized = tag.trim().replace(/^#+/, '').replace(/\s+/g, '');
  if (!normalized) {
    return null;
  }
  return escapeMarkdownV2(`#${normalized}`);
}

function formatTagsLine(tags: string[]): string {
  return tags
    .map(toHashtag)
    .filter((item): item is string => item !== null)
    .join(' ');
}

function formatTitleLine(meta: MessageMeta): string {
  if (!meta.withTitle) {
    return '';
  }
  const escapedTitle = `*${escapeMarkdownV2(meta.title)}*`;
  if (!meta.titleUrl) {
    return escapedTitle;
  }
  return `[${escapedTitle}](${escapeMarkdownLinkUrl(meta.titleUrl)})`;
}

export function formatMessage(paragraphs: Paragraph[], meta: MessageMeta): string {
  const tagsLine = formatTagsLine(meta.tags);
  const titleLine = formatTitleLine(meta);
  const body = paragraphs.map(convertParagraph).join('\n\n');
  return [tagsLine, titleLine, body].filter((part) => part.length > 0).join('\n\n');
}

export function validateMessage(text: string, hasImages: boolean): void {
  const maxLength = hasImages ? 1024 : 4096;
  const field = hasImages ? 'caption' : 'text';

  if (text.length > maxLength) {
    throw new Error(`Telegram ${field} 超长：当前 ${text.length}，上限 ${maxLength}`);
  }
}
