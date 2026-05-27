import type { Root, Html } from 'mdast';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

export interface SanitizeContext {
  slug: string;
  pageId: string;
}

export class MarkdownSanitizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MarkdownSanitizationError';
  }
}

const TABLE_TAGS = new Set([
  'table',
  'colgroup',
  'col',
  'tr',
  'td',
  'th',
  'thead',
  'tbody',
  'tfoot',
  'caption',
]);

const COLUMN_TAGS = new Set(['columns', 'column', 'column_list']);

const TAG_HINTS: Record<string, string> = {
  table:
    'Tables are not supported. Remove the table block in Notion, or rewrite as a list / sequential paragraphs.',
  callout:
    'Callouts are not supported. Convert to a blockquote (>) or a plain paragraph in Notion.',
  columns: 'Column layouts are not supported. Convert to sequential paragraphs in Notion.',
  toggle: 'Toggle blocks are not supported. Convert to a heading with content below it in Notion.',
  span: 'Inline color / underline / background formatting is not supported. Strip the formatting in Notion.',
  unknown:
    "Notion couldn't render this block as markdown. Replace it with a supported block in Notion.",
  equation:
    'Math equations are not supported. Inline as plain text, or convert to an image in Notion.',
  synced_block: 'Synced blocks are not supported. Inline the content directly in Notion.',
  child_page: 'Child page references are not supported. Use an inline [text](url) link in Notion.',
  child_database: 'Child databases are not supported. Remove from the page in Notion.',
  link_to_page: 'Link-to-page blocks are not supported. Use an inline [text](url) link in Notion.',
  bookmark: 'Bookmark blocks are not supported. Use a regular inline link in Notion.',
  embed: 'Embed blocks are not supported. Use a regular link in Notion.',
  video: 'Video embeds are not supported. Link to the video instead in Notion.',
  audio: 'Audio embeds are not supported. Link to the audio file instead in Notion.',
  pdf: 'PDF embeds are not supported. Link to the PDF instead in Notion.',
  file: 'File embeds are not supported. Link to the file instead in Notion.',
  link_preview: 'Link previews are not supported. Use a regular link in Notion.',
  table_of_contents: 'Table-of-contents blocks are not supported. Remove from Notion.',
  breadcrumb: 'Breadcrumb blocks are not supported. Remove from Notion.',
  button: 'Button blocks are not supported. Remove from Notion.',
};

const DEFAULT_HINT =
  'This Notion block has no standard markdown equivalent. Remove or replace it in Notion.';

interface Violation {
  category: string;
  raw: string;
}

function stripEmptyBlocks(raw: string): string {
  return raw.replace(/<empty-block\s*\/?\s*>/gi, '');
}

function isListLine(line: string): boolean {
  return /^\s*([-*+]|\d+\.)\s+/.test(line);
}

/**
 * Notion 官方 markdown API 不会在 block 之间插空行，会导致 CommonMark 的 lazy continuation
 * 把段落吞进上一个 blockquote / list。这里在 parse 之前补空行，确保块边界清晰。代码块内不动。
 */
function insertBlockBoundaryBlanks(text: string): string {
  const lines = text.split('\n');
  const out: string[] = [];
  let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isFence = /^\s{0,3}(```|~~~)/.test(line);
    out.push(line);
    if (isFence) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (line.trim() === '') continue;
    if (i === lines.length - 1) continue;
    const next = lines[i + 1];
    if (next.trim() === '') continue;
    // 紧凑列表：连续的列表项之间不插空行，避免变成 loose list。
    if (isListLine(line) && isListLine(next)) continue;
    out.push('');
  }
  return out.join('\n');
}

function extractTagName(html: string): string {
  const m = html.match(/<\/?([a-zA-Z][\w-]*)/);
  return m ? m[1].toLowerCase() : html.slice(0, 40);
}

function normalizeCategory(tag: string): string {
  const lower = tag.toLowerCase();
  if (TABLE_TAGS.has(lower)) return 'table';
  if (COLUMN_TAGS.has(lower)) return 'columns';
  return lower;
}

function getHint(category: string): string {
  return TAG_HINTS[category] ?? DEFAULT_HINT;
}

/**
 * 只在 raw 包含有用信息（比如属性）时显示，避免出现 `e.g. <table>` 这种空洞重复，
 * 也避免把 `<table><colgroup>...` 里的内嵌标签泄漏到错误信息里。
 */
function rawDisplay(raw: string, category: string): string | null {
  const m = raw.match(/^<\/?[\w-]+(\s[^>]*)?\/?>/);
  if (!m) return null;
  const firstTag = m[0];
  const lower = firstTag.toLowerCase();
  if (lower === `<${category}>` || lower === `</${category}>` || lower === `<${category}/>`) {
    return null;
  }
  return firstTag;
}

function formatErrorMessage(violations: Violation[], ctx: SanitizeContext): string {
  const grouped = new Map<string, { count: number; firstRaw: string }>();
  for (const v of violations) {
    const existing = grouped.get(v.category);
    if (existing) {
      existing.count++;
    } else {
      grouped.set(v.category, { count: 1, firstRaw: v.raw });
    }
  }
  const lines: string[] = [];
  lines.push(
    `❌ Page "${ctx.slug}" (${ctx.pageId}) contains ${grouped.size} unsupported block type(s):`,
  );
  for (const [category, info] of grouped) {
    const suffix = info.count > 1 ? ` × ${info.count}` : '';
    lines.push(`  - <${category}>${suffix}`);
    const display = rawDisplay(info.firstRaw, category);
    if (display) lines.push(`      e.g. ${display}`);
    lines.push(`      → ${getHint(category)}`);
  }
  lines.push(`Remove or replace these blocks in Notion, then refetch.`);
  return lines.join('\n');
}

const processor = unified().use(remarkParse).use(remarkGfm).use(remarkStringify, {
  bullet: '-',
  rule: '-',
  fences: true,
  emphasis: '*',
  strong: '*',
  listItemIndent: 'one',
  tightDefinitions: true,
});

export function sanitizeMarkdown(rawMarkdown: string, ctx: SanitizeContext): string {
  const stripped = stripEmptyBlocks(rawMarkdown);

  // 校验在「未插空行」的版本上进行：GFM pipe-table 的 `| --- |` 分隔行必须紧贴上一行，
  // 一旦插空行就会被解析成普通段落，违规检测会失效。
  const validationTree = processor.parse(stripped) as Root;
  const violations: Violation[] = [];
  visit(validationTree, (node) => {
    if (node.type === 'html') {
      const value = (node as Html).value;
      const tag = extractTagName(value);
      violations.push({
        category: normalizeCategory(tag),
        raw: value.length > 80 ? value.slice(0, 77) + '...' : value,
      });
    } else if (node.type === 'table') {
      violations.push({ category: 'table', raw: '<markdown-table>' });
    }
  });

  if (violations.length > 0) {
    throw new MarkdownSanitizationError(formatErrorMessage(violations, ctx));
  }

  // 格式化：补空行 → 重解析 → 序列化，得到清爽 markdown。
  const withBlanks = insertBlockBoundaryBlanks(stripped);
  const formatTree = processor.parse(withBlanks) as Root;
  return String(processor.stringify(formatTree));
}
