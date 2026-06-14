# 架构概览 PRD — homepage-next

> 本文档从代码倒推，描述项目的完整架构意图、数据流、模块职责与自动化机制。面向未来维护者或需要快速建立全局认知的开发者。

---

## 一、项目定位

个人主页，基于 **Next.js 静态导出**（`output: 'export'`）构建。所有内容在 **Notion** 中编辑，通过一套自定义脚本拉取到本地 Markdown 文件，再由 Next.js 在构建时读取并生成静态 HTML。部署目标为 **Vercel**（依赖 `@vercel/analytics` / `@vercel/speed-insights`）。

核心理念：**Notion 作为 CMS，Git 作为单一事实来源，Vercel 负责托管**。

```
Notion (CMS)
   │  Notion API
   ▼
scripts/ (fetch & sync)
   │  写入 .md 文件
   ▼
content/ (本地 Markdown)
   │  git commit + push
   ▼
GitHub (版本控制 + CI)
   │  Vercel 监听 push 触发构建
   ▼
Vercel (静态站点)
```

---

## 二、内容类型

项目维护 4 个独立的 Notion 数据库，每个库对应一种内容类型：

| 类型                    | Notion DB 环境变量          | 本地目录          | 文件名规则                                 |
| ----------------------- | --------------------------- | ----------------- | ------------------------------------------ |
| **Post**（博客文章）    | `NOTION_POSTS_DATABASE_ID`  | `content/posts/`  | `{slug}.md`                                |
| **Page**（独立页面）    | `NOTION_PAGES_DATABASE_ID`  | `content/pages/`  | `{slug}.md`                                |
| **Kotoba**（语录/短记） | `NOTION_KOTOBA_DATABASE_ID` | `content/kotoba/` | `{published_time前10位}-{page_id末8位}.md` |
| **Taste**（品味/收藏）  | `NOTION_TASTE_DATABASE_ID`  | `content/taste/`  | `{page_id}.md`                             |

所有文件均为带 YAML frontmatter 的 Markdown（`.md`），frontmatter 存储元数据，正文为 Notion 页面内容转换后的 Markdown。

其中 **Kotoba** 增速最快，预计每天至少新增一条，长期条目数将达到数千条——这也是引入增量同步模式的主要动因：避免随条目增长而线性增加的 API 调用量。

---

## 三、同步管道（scripts/）

### 3.1 整体结构

同步管道采用**泛型策略模式**，核心是一个通用类 `NotionDatabaseFetcher<T>`，通过 `NotionFetcherConfig<T>` 配置对象适配不同内容类型。

> **说明**：`queryAllEntries` 调用的是 `notion.dataSources.query`（Notion SDK v5 中的公开 API，完整类型定义在 `Client.d.ts`），并非私有或实验性接口。代码中写成 `(this.notion as any).dataSources.query` 是为了绕过 TypeScript 类型检查——因为 `NotionFetcherConfig<T>.buildFilter` 返回的是宽泛的 `object` 类型，无法直接赋值给 SDK 严格的 `filter` 联合类型，`as any` 在此是类型层面的变通，与 API 可用性无关。

```
fetch-posts.ts   ──┐
fetch-pages.ts   ──┤  各自提供 NotionFetcherConfig<T>
fetch-kotoba.ts  ──┤  ──▶  NotionDatabaseFetcher<T>.fetch()
fetch-taste.ts   ──┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
  queryAllEntries  filterToUpdate  processEntry
  (Notion API)    (增量判断)      (转换+写文件)
```

### 3.2 同步模式（SyncMode）

通过命令行参数控制，三种模式：

| 模式                  | 触发方式      | 行为                                                         |
| --------------------- | ------------- | ------------------------------------------------------------ |
| `incremental`（默认） | 无参数        | 只查询 `last_edited_time` 晚于上次运行的条目；不清理孤儿文件 |
| `full-sync`           | `--full-sync` | 全量拉取所有已发布条目元数据；执行孤儿文件清理               |
| `force`               | `--force`     | 强制处理所有条目（忽略 last_edited_time 比对）               |

首次运行（无状态文件）时，`incremental` 自动降级为 `full-sync`。

### 3.3 状态持久化（.fetch-state.json）

```json
{
  "post": {
    "lastSuccessfulRun": "2026-06-14T02:00:00.000Z",
    "lastFullSync": "2026-06-01T02:00:00.000Z"
  },
  "kotoba": { ... }
}
```

- 文件位于项目根目录，**提交到 git**，确保 GitHub Actions 每次 checkout 后状态可用
- 只有在本次运行产生实际变化（updated > 0 或 deleted > 0 或首次运行）时才更新并写入状态
- 每个 label（post / page / kotoba / taste）独立维护状态，互不干扰

### 3.4 单条目处理流程（processEntry）

```
1. 拉取页面完整对象（notion.pages.retrieve）
2. 扫描所有 files 类型 property 中的图片
   ├─ Notion 托管图片 → 上传 SM.MS → 更新 Notion 属性
   └─ 外部图片（非 SM.MS）→ 同上
3. 调用 NotionToMDXConverter.convertToMDX
   ├─ processPageImages：递归遍历所有 Block
   │   ├─ image block (file)   → 上传 SM.MS → 更新 Block
   │   └─ image block (external, 非 SM.MS) → 同上
   └─ notion-to-md：将 Block 树转换为 Markdown 字符串
4. 更新 Notion 页面的 last_fetched_time 属性（写回 Notion）
5. 调用 generateContent 生成带 frontmatter 的完整 .md 内容
6. 写入本地文件 content/{type}/{fileKey}.md
```

**图片永久化策略**：Notion 托管的图片 URL 会定期失效，因此脚本会将所有图片上传至 SM.MS CDN，并将永久 URL 写回 Notion。后续同步时，SM.MS URL 不再重复上传（通过 `isSmmsUrl` 检测跳过）。

### 3.5 孤儿文件清理

仅在 `full-sync` / `force` 模式下执行。遍历本地目录中的 `.md` 文件，将文件名（不含扩展名）与当前 Notion 数据库中已发布条目的 fileKey 集合比对，删除不在集合中的文件。

### 3.6 环境变量依赖

| 变量                        | 用途               |
| --------------------------- | ------------------ |
| `NOTION_API_SECRET`         | Notion API 认证    |
| `NOTION_POSTS_DATABASE_ID`  | Posts 数据库 ID    |
| `NOTION_PAGES_DATABASE_ID`  | Pages 数据库 ID    |
| `NOTION_KOTOBA_DATABASE_ID` | Kotoba 数据库 ID   |
| `NOTION_TASTE_DATABASE_ID`  | Taste 数据库 ID    |
| `SMMS_API_TOKEN`            | SM.MS 图片上传认证 |

---

## 四、内容加载层（src/app/\_lib/）

Next.js 构建时，页面通过 `_lib/` 中的 Loader 函数读取本地 Markdown 文件并解析，无需任何数据库连接或网络请求。

### 4.1 模块结构

```
_lib/
├── content-utils.ts      — 基础工具：CacheManager、FileUtils
├── post-loader.ts        — 加载 content/posts/
├── page-loader.ts        — 加载 content/pages/
├── kotoba-loader.ts      — 加载 content/kotoba/
├── taste-loader.ts       — 加载 content/taste/
└── pagination-utils.ts   — 分页参数生成工具
```

### 4.2 content-utils.ts

提供两个共享基础设施：

**`CacheManager<T>`**：内存 LRU 缓存，默认 TTL 5 分钟。静态站点构建时，同一 Node.js 进程内多个页面共享缓存，避免重复读文件和解析 frontmatter。

**`FileUtils`**：同步文件读取 + gray-matter frontmatter 解析的封装，统一错误处理。

### 4.3 各 Loader 职责

所有 Loader 遵循相同模式：

```
glob('content/{type}/*.md')
  → 读取文件
  → gray-matter 解析 frontmatter + content
  → 构建类型化 Meta 对象
  → 按时间排序
  → 缓存（CacheManager）
  → 导出具名函数供页面调用
```

| Loader             | 主要导出                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `post-loader.ts`   | `getAllPosts`, `getPostBySlug`, `getCategoryPosts`, `getPostsByTag`, `getAllTags`, `getAllCategories`, `getPostWithContent`, `getPostsTotalWords` |
| `page-loader.ts`   | `getPageWithContent`                                                                                                                              |
| `kotoba-loader.ts` | `getAllKotobaPosts`, `getAllKotobaPostsWithContent`, `getKotobaPostsByTag`, `getAllKotobaTags`                                                    |
| `taste-loader.ts`  | `getAllTasteItemsWithContent`, `groupTasteByCategory`                                                                                             |

### 4.4 pagination-utils.ts

`buildIndexPageParams` / `buildTagPageParams`：为 Next.js `generateStaticParams` 生成所有需要预渲染的路由参数。支持"第 1 页无路径参数"的 URL 风格（`/posts` 等价于 `/posts/1`）。

### 4.5 Post 分类映射

Post 的 `category` 字段来自 Notion，`post-loader` 通过 `site.config` 中的 `categories` 配置将 Notion 原始字段值映射为本地 `categoryKey` 和 `categoryAlias`，实现 Notion 字段与前端路由的解耦。

---

## 五、GitHub Actions 自动化

项目使用两个 workflow，共同构成内容的**自动更新-发布流水线**：

### 5.1 Scheduled Release（`scheduled-release.yml`）

```yaml
触发：每 20 分钟 (*/20 * * * *)
命令：pnpm fetch:all（增量同步）
```

**流程**：

1. Checkout（含完整 git 历史，获取 `.fetch-state.json`）
2. 安装依赖
3. 执行 `fetch:all` → 顺序拉取 4 个内容类型（pages → posts → kotoba → taste，增量模式）
4. 执行 `pnpm exam`（format + lint + typecheck + test）
5. `git add . && git diff --staged` → 有变化则 commit + push

**效果**：Notion 中发布/编辑内容后，最迟 20 分钟内自动同步到 git，触发 Vercel 重新构建部署。

### 5.2 Scheduled Full Sync（`scheduled-full-sync.yml`）

```yaml
触发：每月 1 日和 16 日 UTC 02:00 (0 2 1,16 * *)
命令：pnpm fetch:full-sync（全量同步）
```

**流程**：与 Scheduled Release 相同，区别仅在于使用 `--full-sync` 参数。

**效果**：每半个月执行一次全量同步，清理本地已有但 Notion 中已删除的孤儿文件，保持本地 content 与 Notion 长期一致。

### 5.3 Secrets 配置

两个 workflow 共用相同的 GitHub Secrets：`NOTION_API_SECRET`、`NOTION_POSTS_DATABASE_ID`、`NOTION_PAGES_DATABASE_ID`、`NOTION_KOTOBA_DATABASE_ID`、`NOTION_TASTE_DATABASE_ID`、`SMMS_API_TOKEN`。

### 5.4 workflow 协作关系

```
每 20 分钟
  scheduled-release ──▶ 增量同步 ──▶ 快速捕获新内容

每月 1、16 日
  scheduled-full-sync ──▶ 全量同步 ──▶ 孤儿文件清理 + 一致性保障
```

---

## 六、构建与部署

### 6.1 Next.js 配置

- `output: 'export'`：生成纯静态 HTML/CSS/JS，无 Node.js 运行时依赖
- `images: { unoptimized: true }`：禁用 Next.js 图片优化（静态导出不支持）
- `raw-loader`：将 `.md` 文件作为原始字符串导入（供需要原始内容的场景使用）
- MDX 支持：通过 `@next/mdx` + `remark-gfm`，`.mdx` 文件可作为页面

### 6.2 内容渲染

Markdown 内容在页面层通过 `next-mdx-remote` 渲染，支持自定义组件替换标准 HTML 元素。代码高亮由 `react-syntax-highlighter` 承担。

### 6.3 本地开发 & Release

```bash
# 本地同步内容（增量）
pnpm fetch:all

# 本地一键发布（同步 + 检查 + commit + push）
pnpm release

# 质量检查
pnpm exam   # format + lint + typecheck + test
```

---

## 七、关键设计决策

| 决策                                | 原因                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------- |
| 内容存 Git，不在运行时调 Notion API | 静态导出要求构建时确定性；避免运行时的网络依赖与 API rate limit                 |
| `.fetch-state.json` 提交到 git      | GitHub Actions 无持久化存储；git 本身即状态载体，且可追溯                       |
| 图片上传至 SM.MS 并写回 Notion      | Notion 托管图片 URL 有时效性，永久化后 Markdown 链接长期有效                    |
| 泛型 `NotionDatabaseFetcher<T>`     | 4 种内容类型逻辑一致，避免重复；新增内容类型只需提供配置对象                    |
| 内存缓存（5min TTL）                | 构建时同一进程多页面复用，无 I/O 损耗；开发时 `next dev` 热重载自然触发缓存失效 |
| 全量同步每月仅两次                  | 孤儿清理代价高（全量 API 查询）；增量同步不清理孤儿，定期补全即可               |
