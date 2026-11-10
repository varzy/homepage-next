import { describe, expect, it } from "vitest";

import { convertSnippet, escapeMarkdownV2, formatMessage, validateMessage } from "../src/formatter.js";
import type { RichTextSnippet } from "../src/notion.js";

function createSnippet(partial: Partial<RichTextSnippet>): RichTextSnippet {
  return {
    plainText: partial.plainText ?? "",
    annotations: {
      bold: partial.annotations?.bold ?? false,
      italic: partial.annotations?.italic ?? false,
      strikethrough: partial.annotations?.strikethrough ?? false,
      underline: partial.annotations?.underline ?? false,
      code: partial.annotations?.code ?? false
    },
    href: partial.href ?? null
  };
}

describe("escapeMarkdownV2", () => {
  it("转义 Telegram MarkdownV2 特殊字符", () => {
    expect(escapeMarkdownV2("_*[]()~`>#+-=|{}.!\\")).toBe("\\_\\*\\[\\]\\(\\)\\~\\`\\>\\#\\+\\-\\=\\|\\{\\}\\.\\!\\\\");
  });
});

describe("convertSnippet", () => {
  it("先转义文本再包裹格式并处理链接", () => {
    const snippet = createSnippet({
      plainText: "点击(这里)",
      annotations: { bold: true, italic: true, strikethrough: false, underline: false, code: false },
      href: "https://example.com/path?a=1)"
    });

    expect(convertSnippet(snippet)).toBe("[*_点击\\(这里\\)_*](https://example.com/path?a=1\\))");
  });
});

describe("formatMessage", () => {
  it("按 Tags + 标题 + 正文拼接消息", () => {
    const paragraphs = [
      [createSnippet({ plainText: "第一段", annotations: { bold: true, italic: false, strikethrough: false, underline: false, code: false } })],
      [createSnippet({ plainText: "第二段" })]
    ];

    expect(
      formatMessage(paragraphs, {
        tags: ["标签1", "标签2"],
        withTitle: true,
        title: "这是(标题)",
        titleUrl: "https://example.com/path?a=1)"
      })
    ).toBe(
      "\\#标签1 \\#标签2\n\n[*这是\\(标题\\)*](https://example.com/path?a=1\\))\n\n*第一段*\n\n第二段"
    );
  });

  it("无标签且不带标题时仅输出正文", () => {
    const paragraphs = [[createSnippet({ plainText: "仅正文" })]];

    expect(
      formatMessage(paragraphs, {
        tags: [],
        withTitle: false,
        title: "不会显示",
        titleUrl: "https://example.com"
      })
    ).toBe("仅正文");
  });
});

describe("validateMessage", () => {
  it("无图消息 4096 边界通过", () => {
    expect(() => validateMessage("a".repeat(4096), false)).not.toThrow();
  });

  it("有图 caption 超过 1024 抛错", () => {
    expect(() => validateMessage("a".repeat(1025), true)).toThrow("Telegram caption 超长");
  });
});
