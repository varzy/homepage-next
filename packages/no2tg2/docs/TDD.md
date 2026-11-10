# NO2TG2 — Technical Design Document

## 1. 架构总览

NO2TG2 采用线性管道架构，由 `main.ts` 负责编排：

```text
queryUnpublishedPage
  -> getPageContent
  -> formatMessage
  -> validateMessage
  -> archiveContent        ← 先落盘（下载图片 + 保存正文）
  -> compressImages        ← 压缩本地图片
  -> sendToChannel         ← 使用本地压缩图片发送
  -> markAsPublished
```

核心目标是：从 Notion Data Source 拉取一条待发布页面，将内容转换为 Telegram MarkdownV2，**先备份到本地**，再压缩图片后发送至 Telegram，最后回写 Notion 状态。

---

## 2. 模块设计

### 2.1 `src/config.ts` — 配置模块

```ts
export const config = {
  notion: {
    token: string,
    dataSourceId: string,
  },
  telegram: {
    botToken: string,
    chatId: string,
  },
  archive: {
    dir: string,  // 本地备份根目录，支持绝对路径或相对路径（相对于 cwd）
  },
} as const;
```

说明：

- `archive.dir` 默认值建议为 `"./archives"`
- 不再通过环境变量 `NO2TG2_ARCHIVE_DIR` 读取备份目录，统一由 `config.ts` 管理
- 标签、标题、标题链接全部来自 Notion 页面属性

---

### 2.2 `src/notion.ts` — Notion 数据层

#### 数据结构

```ts
interface NotionPage {
  id: string;
  title: string;
  createdTime: string;
  tags: string[];
  withTitle: boolean;
  titleUrl: string | null;
  icon: string | null;
}
```

`icon` 仅保留可直接文本显示的值（当前仅 emoji）；其他 icon 类型降级为 `null`。

#### `queryUnpublishedPage(): Promise<NotionPage | null>`

使用 `dataSources.query`，按以下规则查询：

- `Status` select equals `"Unpublished"`
- `Name` title is not empty
- `CreatedTime` ascending
- `page_size: 1`

并从页面属性中提取：

- `Name` -> `title`
- `Tags` (multi_select) -> `tags: string[]`
- `WithTitle` (checkbox) -> `withTitle`
- `TitleURL` (url) -> `titleUrl`
- `page.icon.emoji` -> `icon`

#### `getPageContent(pageId: string): Promise<PageContent>`

- 分页读取 `blocks.children.list`
- `paragraph`：提取 `rich_text -> RichTextSnippet[]`
- `image`：提取 `file.url` 或 `external.url`
- 其他 block 打 warning 并跳过

#### `markAsPublished(pageId: string): Promise<void>`

成功发布后更新：

- `Status -> Published`
- `PublishDate -> YYYY-MM-DD`（上海时区，使用 `dayjs` + `timezone` 插件格式化）

---

### 2.3 `src/formatter.ts` — 内容格式化

#### 类型定义

```ts
interface MessageMeta {
  tags: string[];
  withTitle: boolean;
  title: string;
  titleUrl: string | null;
  icon: string | null;
}
```

#### 组装规则

1. 标签行：由 `tags` 生成 `#标签1 #标签2`（空则省略）
2. 标题行：仅在 `withTitle=true` 时输出
   - 标题内容为加粗文本
   - 存在 `icon` 时前置 icon
   - 存在 `titleUrl` 时标题渲染为链接
3. 正文段落：沿用 paragraph 转换逻辑
4. 使用 `\n\n` 拼接所有非空区块

#### MarkdownV2 处理约束

- 普通文本统一走 `escapeMarkdownV2`
- URL 走 `escapeMarkdownLinkUrl`（转义 `)` 与 `\`）
- 标签文本也需要转义，仅保留前导 `#`

---

### 2.4 `src/archive.ts` — 本地落盘备份

本模块在发送 Telegram 之前执行，负责将本次发布内容完整保存到本地。

#### 时间格式化

使用 `dayjs` 配合 `utc` + `timezone` 插件，生成精确到秒的上海时区时间戳：

```ts
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

function formatPublishTimestamp(now: Date = new Date()): string {
  return dayjs(now).tz("Asia/Shanghai").format("YYYY-MM-DD_HH-mm-ss");
}
```

#### 目录命名

```ts
function sanitizePageTitle(title: string): string {
  // 1. Unicode 标准化
  // 2. 去掉所有标点符号（保留字母、数字、空格、下划线、连字符）
  // 3. 空格替换为下划线，合并连续下划线
  // 4. 为空时回退为 "untitled"
}

const folderName = `${formatPublishTimestamp()}-${sanitizePageTitle(pageTitle)}`;
// 示例：2026-05-13_08-02-00-我的文章标题
```

注意时间戳与标题之间使用单个 `-` 分隔。

#### 图片命名

图片按 Notion 页面中的顺序，以 `img_{n}` 为基础名称命名，后缀名根据实际图片格式确定：

| 顺序 | 文件名示例 |
| --- | --- |
| 第 1 张 | `img_1.jpg` |
| 第 2 张 | `img_2.png` |
| 第 3 张 | `img_3.jpg` |

后缀名优先从 HTTP 响应的 `Content-Type` 头判断，其次从 URL 路径的扩展名推断，均无法确定时回退为 `.jpg`。

#### 接口定义

```ts
export interface ArchivePayload {
  pageTitle: string;
  content: string;       // Telegram MarkdownV2 格式的正文
  imageUrls: string[];   // Notion 图片 URL 列表
}

export interface ArchiveResult {
  archiveDir: string;       // 本次存档目录的绝对路径
  imagePaths: string[];     // 下载后的本地图片路径列表（与 imageUrls 顺序对应）
}

export async function archiveContent(payload: ArchivePayload): Promise<ArchiveResult>
```

#### 执行步骤

1. 根据当前时间 + 页面标题生成目录名，并在 `config.archive.dir` 下创建该目录
2. 将 `content` 写入 `content.md`
3. 并发下载所有图片，按 `img_1`、`img_2` 顺序保存至目录
4. 返回 `archiveDir` 和 `imagePaths`

---

### 2.5 `src/compress.ts` — 图片压缩

本模块在归档完成后、发送 Telegram 之前执行，对本地图片进行压缩。

#### 接口定义

```ts
export async function compressImages(imagePaths: string[]): Promise<void>
```

#### 压缩策略（使用 `sharp`）

- 将图片长边限制在 **2560px** 以内，超出则等比缩放（`fit: "inside"`）
- JPEG：质量设为 **85**，原地覆盖输出
- PNG：转换为 JPEG 后覆盖输出（重命名文件，更新 `imagePaths` 中的记录）
- WEBP：质量设为 **85**，原地覆盖输出
- GIF：跳过压缩，保持原文件不变

> 由于压缩后 PNG → JPEG 会导致后缀名变更，`compressImages` 返回值为更新后的路径列表：

```ts
export async function compressImages(imagePaths: string[]): Promise<string[]>
// 返回压缩（及可能重命名）后的本地文件路径列表
```

---

### 2.6 `src/telegram.ts` — Telegram 发送层

发送阶段接受本地文件路径（而非远程 URL），从磁盘读取压缩后的图片进行上传。

#### 接口调整

```ts
// 发送时接受本地文件路径列表
export async function sendToChannel(
  text: string,
  imagePaths: string[],   // 本地图片路径（压缩后）
  api?: TelegramApi,
): Promise<void>
```

内部通过 `fs.readFile` 读取本地文件，构造 `{ source: Buffer, filename: string }` 后上传。

#### 分支策略

- 0 图：`sendMessage`
- 1 图：`sendPhoto + caption`
- 2-10 图：`sendMediaGroup`，caption 仅首图
- >10 图：抛错

全部使用 `parse_mode: "MarkdownV2"`。

---

### 2.7 `src/main.ts` — 流程编排

```ts
// 1. 查询待发布页面
const page = await queryUnpublishedPage();
if (!page) { /* 正常退出 */ }

// 2. 获取页面内容
const content = await getPageContent(page.id);
if (content.paragraphs.length === 0) { /* 警告退出 */ }

// 3. 格式化消息
const message = formatMessage(content.paragraphs, { ...page });
validateMessage(message, content.imageUrls.length > 0);

// 4. 本地落盘备份（下载图片 + 保存正文）
const { archiveDir, imagePaths } = await archiveContent({
  pageTitle: page.title,
  content: message,
  imageUrls: content.imageUrls,
});

// 5. 压缩图片
const compressedPaths = await compressImages(imagePaths);

// 6. 发送到 Telegram
await sendToChannel(message, compressedPaths);

// 7. 更新 Notion 状态
await markAsPublished(page.id);
```

---

## 3. 依赖与脚本

### 3.1 运行时依赖

| 包名 | 用途 |
| --- | --- |
| `@notionhq/client` | Notion API |
| `telegraf` | Telegram Bot API |
| `proxy-agent` | Telegram 代理支持 |
| `dayjs` | 时间格式化（替代 `Intl.DateTimeFormat`） |
| `sharp` | 图片压缩与格式转换 |

### 3.2 开发依赖

| 包名 | 用途 |
| --- | --- |
| `typescript` | 类型检查 |
| `tsx` | 直接运行 TS |
| `@types/node` | Node.js 类型 |
| `vitest` | 单元测试 |

### 3.3 验证脚本

- `pnpm typecheck`
- `pnpm test`

---

## 4. 测试设计

### 4.1 `formatter` 模块

重点覆盖：

- 多标签拼接
- 空标签回退（不输出标签行）
- `WithTitle` 开关
- `TitleURL` 链接标题
- emoji icon + 标题组合
- MarkdownV2 特殊字符转义
- 消息长度验证（文本上限 4096 / caption 上限 1024）

### 4.2 `archive` 模块

重点覆盖：

- `formatPublishTimestamp` 时区正确性（上海时区）
- `sanitizePageTitle` 标点去除、空格转换、空标题回退
- 目录命名格式（时间戳 + `-` + 标题）
- 图片文件命名（`img_1`、`img_2` 等）

### 4.3 `compress` 模块

重点覆盖：

- 超尺寸图片被等比缩放至 2560px 以内
- PNG 被转换为 JPEG 并更新路径
- GIF 跳过压缩

---

## 5. 错误与边界处理

| 场景 | 处理方式 |
| --- | --- |
| 查询无结果 | 正常退出（exit code 0） |
| `Name` 为空 | 在查询阶段过滤，不进入发布流程 |
| `Tags` 为空 | 允许发布，仅不输出标签行 |
| `WithTitle=true` 且 `TitleURL` 无效 | 由 Telegram API 兜底报错 |
| icon 非 emoji | 忽略 icon，使用随机 fallback emoji |
| 正文为空 | 跳过发布（警告退出） |
| 图片下载失败 | 抛出错误，发布流程中断（含具体 URL 和 HTTP 状态码） |
| 图片压缩失败 | 抛出错误，发布流程中断 |
| 图片数量 > 10 | 抛出错误，发布流程中断 |
| Telegram 发送失败 | 抛出错误退出；本地备份已存在，Notion 状态不更新 |
| Notion 状态更新失败 | 输出错误日志，提示手动更新；exit code 设为 1 |
