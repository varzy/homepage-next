# IMPL — Notion 增量同步技术实施方案

对应需求文档：[PRD_3.1.md](./PRD_3.1.md)

---

## 一、新增概念

### SyncMode

用三种模式取代现有的单一 `forceMode: boolean`：

| 模式 | 触发参数 | Notion 查询范围 | 本地时间戳二次比对 | 孤儿文件清理 | 写入状态文件 |
|---|---|---|---|---|---|
| `incremental`（默认）| 无 | 只查 `last_edited_time >= lastSuccessfulRun` | 是（双保险） | 否 | 有内容变化时写入 |
| `full-sync` | `--full-sync` | 全量 | 是 | 是 | 有内容变化时写入 |
| `force` | `--force` | 全量 | 否（强制处理） | 是 | 有内容变化时写入 |

**首次运行**（无状态文件或对应 label 无记录）：自动降级为 `full-sync`，打印提示日志。

### 状态文件 `.fetch-state.json`

位于项目根目录，提交到 git（**不加入 `.gitignore`**）。

```json
{
  "kotoba": {
    "lastSuccessfulRun": "2026-06-14T10:00:00.000Z",
    "lastFullSync": "2026-05-01T10:00:00.000Z"
  },
  "posts": {
    "lastSuccessfulRun": "2026-06-14T10:00:00.000Z",
    "lastFullSync": "2026-05-01T10:00:00.000Z"
  },
  "pages": {
    "lastSuccessfulRun": "2026-06-14T10:00:00.000Z",
    "lastFullSync": "2026-05-01T10:00:00.000Z"
  },
  "taste": {
    "lastSuccessfulRun": "2026-06-14T10:00:00.000Z",
    "lastFullSync": "2026-05-01T10:00:00.000Z"
  }
}
```

- `lastSuccessfulRun`：任意模式运行成功且有内容变化后更新
- `lastFullSync`：仅 `full-sync` 或 `force` 成功且有内容变化后更新
- 只有 `result.updated > 0 || result.deleted > 0` 时才写入，避免 GitHub Actions 产生无意义提交

---

## 二、文件改动清单

### `scripts/types.ts`

新增：

```ts
export type SyncMode = 'incremental' | 'full-sync' | 'force';

export interface FetchStateEntry {
  lastSuccessfulRun: string; // ISO 8601
  lastFullSync: string;      // ISO 8601
}

export interface FetchState {
  [label: string]: FetchStateEntry;
}
```

---

### `scripts/notion-database-fetcher.ts`

**接口变更：`NotionFetcherConfig.buildFilter`**

```ts
// 改前
buildFilter(): object;

// 改后
buildFilter(since?: Date): object;
```

**构造函数**

```ts
// 改前
constructor(private config: NotionFetcherConfig<T>, private forceMode: boolean)

// 改后
constructor(private config: NotionFetcherConfig<T>, private syncMode: SyncMode)
```

**新增私有方法：`readState`**

读取 `.fetch-state.json`，返回当前 label 的 `FetchStateEntry`，文件不存在或字段缺失时返回 `null`。

**新增私有方法：`writeState`**

接受 `SyncMode`，写入 `.fetch-state.json`：
- 任意模式：更新 `lastSuccessfulRun`
- `full-sync` / `force`：同时更新 `lastFullSync`
- 使用读-改-写，不覆盖其他 label 的数据

**`fetch()` 主方法逻辑变更**

```
1. readState() 获取 lastSuccessfulRun
2. 若 syncMode === 'incremental' 且无 lastSuccessfulRun → 自动切换为 full-sync，打印日志
3. 确定 since: syncMode 为 incremental 时 since = lastSuccessfulRun，否则 since = undefined
4. queryAllEntries(since) 拉取元数据
5. filterToUpdate() 二次过滤（force 模式跳过）
6. 逐条 processEntry()
7. syncMode 为 full-sync 或 force 时执行 cleanupOrphanedFiles()
8. result.updated > 0 || result.deleted > 0 时调用 writeState()
```

**`queryAllEntries()` 方法**

签名改为接受可选 `since?: Date`，传给 `this.config.buildFilter(since)`。

**`filterToUpdate()` 方法**

`force` 模式直接返回全部（现有逻辑）；`incremental` 和 `full-sync` 保留本地时间戳二次比对。

---

### `scripts/fetch-kotoba.ts` / `fetch-posts.ts` / `fetch-pages.ts` / `fetch-taste.ts`

四个文件改动相同。

**`buildFilter` 签名**

```ts
// 改前
buildFilter: () => ({ and: [...] })

// 改后
buildFilter: (since?: Date) => ({
  and: [
    // 原有条件不变
    ...(since
      ? [{ timestamp: 'last_edited_time', last_edited_time: { on_or_after: since.toISOString() } }]
      : []),
  ],
})
```

**`main()` 中的模式解析**

```ts
// 改前
const forceMode = process.argv.includes('--force');
await new NotionDatabaseFetcher(config, forceMode).fetch();

// 改后
const syncMode: SyncMode = process.argv.includes('--force')
  ? 'force'
  : process.argv.includes('--full-sync')
    ? 'full-sync'
    : 'incremental';
await new NotionDatabaseFetcher(config, syncMode).fetch();
```

---

### `package.json`

新增脚本：

```json
"fetch:full-sync": "pnpm run fetch:pages -- --full-sync && pnpm run fetch:posts -- --full-sync && pnpm run fetch:kotoba -- --full-sync && pnpm run fetch:taste -- --full-sync"
```

`fetch:all` 保持不变，调用时默认走 `incremental` 模式。

---

### `.github/workflows/scheduled-full-sync.yml`（新建）

每月 1 日和 16 日北京时间上午 10:00（UTC 02:00）执行完整同步。

```yaml
name: Scheduled Full Sync

on:
  schedule:
    - cron: '0 2 1,16 * *'
  workflow_dispatch:

jobs:
  full-sync:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    permissions:
      contents: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          fetch-depth: 0

      - name: Setup pnpm
        uses: pnpm/action-setup@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Full sync content from Notion
        run: pnpm fetch:full-sync
        env:
          NOTION_API_SECRET: ${{ secrets.NOTION_API_SECRET }}
          NOTION_POSTS_DATABASE_ID: ${{ secrets.NOTION_POSTS_DATABASE_ID }}
          NOTION_PAGES_DATABASE_ID: ${{ secrets.NOTION_PAGES_DATABASE_ID }}
          NOTION_KOTOBA_DATABASE_ID: ${{ secrets.NOTION_KOTOBA_DATABASE_ID }}
          NOTION_TASTE_DATABASE_ID: ${{ secrets.NOTION_TASTE_DATABASE_ID }}
          SMMS_API_TOKEN: ${{ secrets.SMMS_API_TOKEN }}

      - name: Run checks
        run: pnpm run exam

      - name: Commit and push if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add .
          if git diff --staged --quiet; then
            echo "No changes, skipping commit."
          else
            git commit -m "Release."
            git push
          fi
```

`timeout-minutes` 设为 30（比日常的 15 分钟更宽松），因为完整同步可能处理更多条目。

---

## 三、运行行为对照

| 命令 | 改动前 | 改动后 |
|---|---|---|
| `pnpm fetch:kotoba` | 全量元数据 + 增量处理 + 孤儿清理 | 增量元数据 + 增量处理，不清理孤儿 |
| `pnpm fetch:kotoba --full-sync` | 不存在 | 全量元数据 + 增量处理 + 孤儿清理 |
| `pnpm fetch:kotoba --force` | 全量元数据 + 强制处理全部 + 孤儿清理 | 同左（行为不变） |
| `pnpm fetch:all` | 全量元数据 + 增量处理 + 孤儿清理 | 增量元数据 + 增量处理，不清理孤儿 |
| `pnpm fetch:full-sync` | 不存在 | 所有 fetcher 跑 full-sync |

---

## 四、风险与注意事项

### 风险一：`dataSources.query` 对 `last_edited_time` 过滤器的兼容性

**这是实施前必须验证的前提条件。**

当前代码使用 `this.notion.dataSources.query`（非标准 API），标准 Notion `last_edited_time` 时间戳过滤器语法属于 `databases.query`。两者的 filter schema 是否兼容尚不确定。

验证方法：写一个临时脚本，对 kotoba 数据库传入带 `last_edited_time` 过滤条件的查询，观察返回结果是否符合预期。

若不兼容，增量过滤只能退化为按 `published_time` 过滤（方案 A 的效果），仍有价值但无法捕获旧条目的编辑。

### 风险二：孤儿文件清理频率降低

日常增量运行不再清理孤儿文件。若在 Notion 中取消发布一篇内容，本地对应的 `.md` 文件会一直残留，直到下一次 `full-sync`（最长约 15 天）。这在当前的使用场景下可以接受。

### 风险三：状态文件与实际内容不一致

若手动删除本地 content 文件后未跑 `full-sync`，状态文件中的 `lastSuccessfulRun` 仍然是旧时间，增量查询可能漏掉这些文件的重新生成。

解决：手动删除本地文件后，跑一次 `--full-sync` 或 `--force`。

---

## 五、推荐工作流

```
日常使用（自动）：GitHub Actions scheduled-release，每 20 分钟，incremental
定期维护（自动）：GitHub Actions scheduled-full-sync，每月 1、16 日，full-sync
手动触发全量：   pnpm fetch:full-sync
强制重建指定库：  pnpm fetch:kotoba --force
```
