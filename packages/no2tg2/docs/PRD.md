# NO2TG2 — Product Requirements Document

## 1. 项目概述

**NO2TG2**（Notion to Telegram）是一个命令行工具，用于将 Notion 数据源（Data Source）中处于「待发布」状态的页面内容，自动格式化后发布到指定的 Telegram 频道。

用户通过执行 `pnpm release` 命令，程序会从 Notion 数据源中筛选出状态为 **Unpublished** 且 `Name` 非空、创建时间最早的一条记录，将其正文内容和图片发送到 Telegram 频道，并在 Notion 中更新该记录的发布状态和发布日期。

### 1.1 技术栈

| 层面 | 选型 |
| --- | --- |
| 运行时 | Node.js |
| 包管理 | pnpm |
| 语言 | TypeScript |
| Notion SDK | `@notionhq/client` |
| Telegram SDK | `telegraf` |
| 时间处理 | `dayjs`（配合 `utc` + `timezone` 插件） |
| 图片压缩 | `sharp` |
| 构建/执行 | `tsx`（直接运行 TS，免编译） |

### 1.2 设计原则

- **极简**：这是一个单次执行的 CLI 脚本，不是服务。没有 HTTP 服务器、没有定时任务、没有数据库。
- **直出**：配置直接硬编码在 `config.ts` 中，无需 `.env` 管理。
- **可靠**：发布流程中每一步都有清晰的错误处理和日志输出。
- **先备份后发送**：内容在发送到 Telegram 之前，先落盘到本地，确保即使发送失败也有完整存档。

---

## 2. Notion 数据源结构

| 属性名 | 类型 | 说明 |
| --- | --- | --- |
| `Name` | Title | 页面标题（Notion 默认字段） |
| `PublishDate` | Date | 记录实际发布时间，默认为空，发布后由程序写入 |
| `Status` | Select | 页面状态，可选值：`Draft` / `Unpublished` / `Published` |
| `CreatedTime` | Created time | Notion 自动维护的创建时间 |
| `Tags` | Multi-select | 用于生成 Telegram 首行标签，支持多个标签 |
| `WithTitle` | Checkbox | 是否在正文前输出标题 |
| `TitleURL` | URL | 标题跳转链接（仅 `WithTitle=true` 时生效） |

### 2.1 页面正文结构

每个 Notion 页面的正文由以下 Block 类型组成：

- **Paragraph**：正文文字段落
- **Image**：图片

程序只需要关注这两种 Block 类型。如遇到其他类型的 Block（如 heading、callout 等），应跳过并在控制台输出警告。

---

## 3. 发布流程

```text
pnpm release
    │
    ▼
┌──────────────────────────────┐
│  1. 查询 Notion 数据源        │
│     Status = "Unpublished"   │
│     Name 非空                 │
│     按 CreatedTime 升序       │
│     取第 1 条（最旧）          │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  2. 获取页面 Blocks           │
│     提取所有 paragraph 文字   │
│     提取所有 image URL        │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  3. 构建 Telegram 消息        │
│     格式化为目标格式           │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  4. 本地落盘备份              │
│     下载图片到本地            │
│     保存正文为 content.md     │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  5. 压缩图片                  │
│     对备份图片进行压缩         │
│     防止触发 Telegram 尺寸限制 │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  6. 发送到 Telegram 频道      │
│     使用本地压缩图片上传       │
│     根据图片数量选择发送方式   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│  7. 更新 Notion 页面属性      │
│     Status → "Published"     │
│     PublishDate → 当前日期    │
└──────────────────────────────┘
```

### 3.1 查询逻辑

使用 Notion Data Source Query API，筛选条件：

```text
filter: Status equals "Unpublished" AND Name is not empty
sorts:  CreatedTime ascending
page_size: 1
```

如果查询结果为空，程序输出提示信息并正常退出（exit code 0）。

### 3.2 内容提取

获取页面的所有子 Block，遍历处理：

- **paragraph block**：提取 `rich_text` 数组，保留每个文本片段的 `plain_text` 及其 `annotations`（bold、italic、strikethrough、underline、code）和 `href`（链接）信息。这些富文本信息将在格式化阶段转换为 Telegram MarkdownV2 语法。
- **image block**：提取图片 URL。Notion 中图片有两种来源：
  - `type: "file"`：Notion 托管的图片，URL 有时效性（通常 1 小时），需在时效内完成下载。
  - `type: "external"`：外部链接图片，URL 持久有效。

### 3.3 消息格式

使用 **Telegram MarkdownV2** 格式发送，以保留 Notion 中的富文本样式。

最终发送到 Telegram 的文本结构为：

```text
#标签1 #标签2

🔥 *这是一个加粗的标题*

正文第一段（可能包含 *加粗*、_斜体_、[链接](url) 等格式）...

正文第二段...
```

格式要点：

- 第一行来自 `Tags`（Multi-select），按 `#标签1 #标签2` 形式拼接；为空时不输出标签行
- `WithTitle=true` 时在正文前输出标题行；若页面 icon 为 emoji，则在标题前附加 emoji
- `WithTitle=true` 且 `TitleURL` 非空时，将标题渲染为可点击链接
- 标题与正文之间空一行，段落与段落之间空一行
- 使用 `parse_mode: "MarkdownV2"` 发送

### 3.4 Notion → Telegram MarkdownV2 格式映射

Notion 的 `rich_text` 中每个文本片段可能携带以下 annotations，需逐一转换为 Telegram MarkdownV2 语法：

| Notion annotation | Telegram MarkdownV2 | 示例 |
| --- | --- | --- |
| `bold` | `*text*` | `*加粗文字*` |
| `italic` | `_text_` | `_斜体文字_` |
| `strikethrough` | `~text~` | `~删除线~` |
| `underline` | `__text__` | `__下划线__` |
| `code` | `` `text` `` | `` `行内代码` `` |
| `href`（链接） | `[text](url)` | `[点击这里](https://example\.com)` |

**MarkdownV2 转义规则**：在 MarkdownV2 模式下，以下字符如果作为普通文本出现，必须用 `\` 转义：

```text
_ * [ ] ( ) ~ ` > # + - = | { } . !
```

**转义顺序**：先对 `plain_text` 进行特殊字符转义，再包裹格式标记（`*`、`_` 等），最后处理链接。如果顺序反转，格式标记本身会被错误转义。

### 3.5 本地落盘备份

在发送到 Telegram 之前，将本次内容完整备份到本地文件系统。

**备份目录路径**：由 `config.ts` 中的 `archive.dir` 配置，支持绝对路径或相对路径（相对于项目根目录）。

**目录命名规则**：`{发送时间戳}-{页面标题}`

- 发送时间戳：精确到秒，格式为 `YYYY-MM-DD_HH-MM-SS`（上海时区，UTC+8）
- 页面标题：取 Notion `Name` 字段的纯文字内容，去掉所有标点符号，空格替换为下划线
- 示例：`2026-05-13_08-02-00-我的文章标题`

**目录内容**：

| 文件 | 说明 |
| --- | --- |
| `content.md` | 格式化后的 Telegram 消息正文（MarkdownV2 格式） |
| `img_1.jpg` / `img_1.png` 等 | 第 1 张图片，后缀名依据实际格式确定 |
| `img_2.jpg` / `img_2.png` 等 | 第 2 张图片，以此类推 |

图片先下载到此目录，再进行压缩（原地覆盖），然后以本地文件路径发送到 Telegram。

### 3.6 图片压缩

在图片落盘完成后、发送到 Telegram 之前，对所有图片执行自动压缩，以防触发 Telegram 的图片尺寸/大小限制。

压缩策略：

- 使用 `sharp` 进行压缩处理
- 将图片长边限制在 **2560px** 以内（超出则等比缩放）
- JPEG / WEBP 质量设为 **85**
- PNG 转换为 JPEG 输出（减小体积），GIF 保持原格式不处理
- 压缩结果原地覆盖存档图片

### 3.7 Telegram 发送策略

发送阶段使用本地文件（压缩后）而非原始 URL，根据图片数量采用不同的发送方式：

| 场景 | API 方法 | 说明 |
| --- | --- | --- |
| 无图片 | `sendMessage` | 仅发送文本 |
| 1 张图片 | `sendPhoto` | 发送单图，正文作为 caption |
| 2-10 张图片 | `sendMediaGroup` | 发送图片组，正文作为第一张图的 caption |
| 超过 10 张图片 | 报错退出 | Telegram 限制 media group 最多 10 张 |

> **注意**：Telegram 的 caption 长度限制为 **1024** 字符（非 sendMessage 的 4096），超长时应报错。

### 3.8 状态更新

发送成功后，更新 Notion 页面属性：

- `Status` → `Published`
- `PublishDate` → 当前日期（格式：`YYYY-MM-DD`，上海时区）

---

## 4. 配置管理

所有配置集中在 `src/config.ts` 文件中：

```typescript
export const config = {
  notion: {
    token: "ntn_xxxxx",
    dataSourceId: "xxxxx",
  },
  telegram: {
    botToken: "123456:ABC-DEF...",
    chatId: "@channel_name",  // 或 "-100xxxxxxxxxx"
  },
  archive: {
    dir: "./archives",  // 本地备份目录，支持绝对路径或相对路径
  },
};
```

---

## 5. 日志与错误处理

### 5.1 正常流程日志

程序在关键步骤输出日志，便于用户了解执行进度：

```text
[NO2TG2] 正在查询 Notion 数据库...
[NO2TG2] 找到待发布页面：「页面标题」(created: 2026-05-13)
[NO2TG2] 正在获取页面内容...
[NO2TG2] 内容提取完成：3 段文字，2 张图片
[NO2TG2] 正在备份内容到本地...
[NO2TG2] 备份完成：./archives/2026-05-13_08-02-00-页面标题
[NO2TG2] 正在压缩图片...
[NO2TG2] 图片压缩完成（共 2 张）
[NO2TG2] 正在发送到 Telegram...
[NO2TG2] 发送成功！
[NO2TG2] 正在更新 Notion 状态...
[NO2TG2] 完成！页面「页面标题」已发布
```

### 5.2 错误处理

| 错误场景 | 处理方式 |
| --- | --- |
| 没有待发布的页面 | 输出 `没有待发布的页面` 并正常退出 |
| Notion API 调用失败 | 输出错误详情并以 exit code 1 退出 |
| 页面正文为空 | 输出警告并退出（空页面不发布） |
| 图片超过 10 张 | 输出错误并退出 |
| Caption 超长 | 输出错误并退出（附当前长度） |
| 图片下载失败 | 输出错误并退出（备份与发送均依赖下载） |
| 图片压缩失败 | 输出错误并退出 |
| Telegram 发送失败 | 输出错误详情并退出（此时不更新 Notion 状态，但本地备份已存在） |
| Notion 状态更新失败 | 输出错误（但消息已发出，提示手动更新） |

---

## 6. 项目结构

```text
no2tg2/
├── docs/
│   ├── PRD.md              # 本文档
│   └── TDD.md              # 技术设计文档
├── src/
│   ├── config.ts           # 配置文件（含敏感信息）
│   ├── main.ts             # 入口文件，流程编排
│   ├── notion.ts           # Notion API 封装
│   ├── formatter.ts        # 内容格式化（MarkdownV2）
│   ├── archive.ts          # 本地落盘备份
│   ├── compress.ts         # 图片压缩
│   ├── telegram.ts         # Telegram API 封装
│   ├── proxy.ts            # 代理支持
│   └── logger.ts           # 日志工具
├── archives/               # 默认备份目录（可在 config.ts 中修改）
├── package.json
├── tsconfig.json
├── .gitignore
└── README.md
```

---

## 7. 非功能性需求

- **单次执行**：程序执行一次即退出，不常驻。
- **幂等安全**：即使重复执行也不会发布重复内容（依赖 Status 字段判断）。
- **无编译步骤**：使用 `tsx` 直接运行 TypeScript，开发和执行体验一致。
- **最小依赖**：仅引入必要的第三方库。
- **先备份后发送**：即使 Telegram 发送失败，本次内容的本地备份已完成，不会丢失。
