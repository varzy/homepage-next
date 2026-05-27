import { describe, it, expect } from 'vitest';
import { sanitizeMarkdown, MarkdownSanitizationError } from '../scripts/markdown-sanitizer';

const ctx = { slug: 'test-page', pageId: 'page-id-123' };

describe('scripts/markdown-sanitizer.ts', () => {
  describe('strips safe artifacts', () => {
    it('removes <empty-block/> tags', () => {
      const input = '# Hello\n<empty-block/>\nWorld';
      const out = sanitizeMarkdown(input, ctx);
      expect(out).not.toContain('<empty-block');
      expect(out).toContain('# Hello');
      expect(out).toContain('World');
    });

    it('removes <empty-block /> with whitespace and case variants', () => {
      const input = 'A\n<EMPTY-BLOCK />\nB\n<empty-block  />\nC';
      const out = sanitizeMarkdown(input, ctx);
      expect(out).not.toMatch(/empty-block/i);
    });
  });

  describe('rejects unsupported blocks', () => {
    it('throws on <table>', () => {
      const input = '# Title\n<table><tr><td>cell</td></tr></table>';
      expect(() => sanitizeMarkdown(input, ctx)).toThrow(MarkdownSanitizationError);
    });

    it('throws on <callout>', () => {
      const input = '# Title\n\n<callout icon="💡">tip</callout>';
      expect(() => sanitizeMarkdown(input, ctx)).toThrow(/callout/);
    });

    it('throws on <span underline>', () => {
      const input = 'Some <span underline="true">text</span> here.';
      expect(() => sanitizeMarkdown(input, ctx)).toThrow(/span/);
    });

    it('throws on <columns> / <column>', () => {
      const input = '<columns><column>a</column><column>b</column></columns>';
      expect(() => sanitizeMarkdown(input, ctx)).toThrow(/columns/);
    });

    it('throws on <toggle>', () => {
      const input = '<toggle>hidden</toggle>';
      expect(() => sanitizeMarkdown(input, ctx)).toThrow(/toggle/);
    });

    it('throws on <unknown>', () => {
      const input = '<unknown url="x" alt="child_page"/>';
      expect(() => sanitizeMarkdown(input, ctx)).toThrow(/unknown/);
    });

    it('throws on GFM markdown tables (|...|)', () => {
      const input = '| a | b |\n| --- | --- |\n| 1 | 2 |';
      expect(() => sanitizeMarkdown(input, ctx)).toThrow(/table/);
    });

    it('aggregates multiple violations into one error', () => {
      const input = `# Title

<callout>tip</callout>

<table><tr><td>x</td></tr></table>

text <span color="red">red</span> end.
`;
      let captured: Error | null = null;
      try {
        sanitizeMarkdown(input, ctx);
      } catch (e) {
        captured = e as Error;
      }
      expect(captured).toBeInstanceOf(MarkdownSanitizationError);
      const msg = captured!.message;
      expect(msg).toContain('<callout>');
      expect(msg).toContain('<table>');
      expect(msg).toContain('<span>');
      expect(msg).toContain('test-page');
      expect(msg).toContain('page-id-123');
    });

    it('buckets <colgroup> / <col> / <tr> / <td> under <table>', () => {
      const input = '<table><colgroup><col/></colgroup><tr><td>x</td></tr></table>';
      let captured: Error | null = null;
      try {
        sanitizeMarkdown(input, ctx);
      } catch (e) {
        captured = e as Error;
      }
      const msg = captured!.message;
      // Should report a single "table" category, not separate colgroup/col/tr/td entries
      expect(msg).toMatch(/<table>/);
      expect(msg).not.toMatch(/<colgroup>/);
      expect(msg).not.toMatch(/<tr>/);
      expect(msg).not.toMatch(/<td>/);
    });

    it('includes a fix hint in the error message', () => {
      const input = '<callout>tip</callout>';
      expect(() => sanitizeMarkdown(input, ctx)).toThrow(/Convert to a blockquote/);
    });
  });

  describe('does not flag standard markdown', () => {
    it('passes plain prose, headings, lists, blockquote, image, link, code', () => {
      const input = `# Heading

A paragraph with **bold**, *italic*, \`code\`, [link](https://example.com), and an image:

![alt](https://example.com/img.png)

- one
- two
- three

1. first
2. second

> a quote line
> spanning two lines

\`\`\`ts
const x: number = 1;
\`\`\`

---

End.
`;
      expect(() => sanitizeMarkdown(input, ctx)).not.toThrow();
      const out = sanitizeMarkdown(input, ctx);
      expect(out).toContain('# Heading');
      expect(out).toContain('![alt](https://example.com/img.png)');
      expect(out).toContain('```');
    });

    it('does not flag HTML-like content inside fenced code blocks', () => {
      const input = `Here is some code:

\`\`\`html
<table>
  <tr><td>cell</td></tr>
</table>
\`\`\`

End.
`;
      expect(() => sanitizeMarkdown(input, ctx)).not.toThrow();
    });

    it('does not flag HTML-like content inside inline code', () => {
      const input = 'Use the `<table>` tag for tables.';
      expect(() => sanitizeMarkdown(input, ctx)).not.toThrow();
    });
  });

  describe('formats output reasonably', () => {
    it('separates adjacent blocks with blank lines so blockquotes do not absorb paragraphs', () => {
      const input = `> a blockquote line
this is a separate paragraph, not part of the quote.`;
      const out = sanitizeMarkdown(input, ctx);
      // The second line must not end up rendered inside the blockquote
      const lines = out.split('\n');
      const quoteIndex = lines.findIndex((l) => l.startsWith('>'));
      const paraIndex = lines.findIndex((l) => l.startsWith('this is a separate'));
      expect(paraIndex).toBeGreaterThan(quoteIndex);
      // There should be at least one blank line between them
      const between = lines.slice(quoteIndex + 1, paraIndex);
      expect(between.some((l) => l.trim() === '')).toBe(true);
    });

    it('ends with a single trailing newline', () => {
      const input = '# Title\n\nbody';
      const out = sanitizeMarkdown(input, ctx);
      expect(out.endsWith('\n')).toBe(true);
      expect(out.endsWith('\n\n')).toBe(false);
    });
  });
});
