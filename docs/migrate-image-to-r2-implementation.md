# 图片迁移至 Cloudflare R2 — 实施文档（终版）

> 配套需求文档：[migrate-image-to-r2-PRD.md](./migrate-image-to-r2-PRD.md)
> 本文档只厘清现状、给出方案与决策、确定后续开发方向，不写代码。文中所有「现状」结论均来自对仓库实际数据与脚本的核查。本终版整合了此前数次修订，消除了编号错位、时间失效、前后矛盾等歧义。

## 术语

- **s.ee**：原图床（即 sm.ms），域名含 `i.see.you`、`cdn.sa.net` 等（[smms-uploader.ts](../scripts/smms-uploader.ts) 的 `isSmmsUrl` 列了 10 个）。
- **R2-hash URL**：上一次失败迁移写入 Notion 的、形如 `https://img.varzy.me/images/posts_<pageId>_<sha1>.jpg` 的链接（或更早 basename 版本）。
- **legacy URL**：本次迁移的目标形态，`https://cdn.varzy.me/legacy/<原 s.ee 路径>`。
- **content.prod**：生产数据的本地备份（`.md` 文件），是迁移前的 s.ee 真源。
- **blockId 配对**：本次回写核心策略，见 D4。

---

## 0. 现状盘点（基于实际核查）

### 0.1 数据现状

**content.prod/（迁移前的 s.ee 真源）**

| 内容库             | s.ee 图片引用数 | 说明                                                     |
| ------------------ | --------------- | -------------------------------------------------------- |
| posts              | 461             | 正文图片块                                               |
| kotoba             | 100             | 正文图片块                                               |
| taste              | 96              | 全部是 `cover:` frontmatter（对应 Notion 的 files 属性） |
| pages              | 1               | 仅 1 张                                                  |
| **合计引用**       | **658**         |                                                          |
| **去重后独立 URL** | **654**         | 4 张被多页复用                                           |

s.ee 域名分布（独立 URL）：

- `cdn.sa.net`：428 张（2024 年前后，路径形如 `https://cdn.sa.net/2024/03/15/62zxcBnLbVQrl9I.png`，**无**随机目录段）
- `i.see.you`：226 张（2026 年前后，路径形如 `https://i.see.you/2026/05/21/jZf0/blog_kotoba_35edc9c0_35fdc9c0-36.webp`，**含** 4 位随机目录段）

两种路径结构不同，但「取 host 之后的完整路径」即可统一覆盖（见 D2 映射）。

**content.prod 的图片全部是 s.ee**（已核查：无非 s.ee、非 varzy 的外链），无需过滤外链。

**content/（本地）与 content.prod 的关系**：两者每页图片数**逐页完全一致**（4 库零差异），且 content/ 同为纯 s.ee。content/ 的 posts 全量同步发生在 `2026-08-18 16:06`（北京，见 `.fetch-state.json`），而失败迁移的提交 `5366a44` 发生在 `2026-08-18 21:54`（北京）——content/ 的同步早于迁移尝试约 6 小时。因此：

- **content/ 与 content.prod 是迁移前的干净 s.ee 快照**（blockId 配对的位置真源）。
- **线上 Notion 是迁移后的混乱态**（PRD 所述「大部分 R2、一部分 s.ee、且存在错位」）——content/ 因早于迁移尝试而未反映这一混乱，这并不矛盾。

### 0.2 关键结论

1. **content.prod 是迁移的位置真源**：保留迁移前的、按文档顺序排列的 s.ee 原始链接，且含 taste `cover` frontmatter。是回写的唯一可信依据。
2. **content.prod 不含 Notion 页面级 cover/icon**：.md frontmatter 只记录了 taste 的 `cover` **属性**，未记录页面级 `page.cover` / `page.icon`。这两类需单独扫描线上 Notion（见 Step 0 第 5 项）。
3. **回写策略与线上当前状态无关**：无论线上某块是 s.ee、R2-hash、错位 R2-hash、还是已 legacy，blockId 配对都按 `ids[i] ← legacy(urls[i])` 覆盖，不看当前 URL。这是设计的核心鲁棒点，也是混合状态页面能被正确处理的关键（见 D4）。

### 0.3 现有脚本与上一次迁移的 Bug

| 脚本                                                              | 作用                                                                                                  | 与本次迁移的关系                                                               |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [image-processor.ts](../scripts/image-processor.ts)               | 常规抓取处理图片（上传未托管图）+ 迁移模式处理 s.ee 图                                                | 阶段二复用常规流程；阶段一不直接用                                             |
| [r2-uploader.ts](../scripts/r2-uploader.ts)                       | R2 S3 上传，含 `uploadExternalIdempotent`（HEAD 幂等跳过）、`composeR2Key`、`is404`、`getContentType` | 阶段一复用其 S3 client / HEAD / 上传原语                                       |
| [smms-uploader.ts](../scripts/smms-uploader.ts)                   | s.ee 上传 + `isSmmsUrl`                                                                               | 阶段一仅用 `isSmmsUrl` 做识别；阶段二后移除                                    |
| [image-uploader.ts](../scripts/image-uploader.ts)                 | provider 抽象 + `stableFileNameFromUrl`（sha1 命名）+ `generateFileName`（随机命名）                  | `stableFileNameFromUrl` 的哈希思路阶段二保留                                   |
| [migrate-smms-to-r2.ts](../scripts/migrate-smms-to-r2.ts)         | 上一次失败的全量迁移脚本                                                                              | **删除**（被阶段一新脚本取代）                                                 |
| [cleanup-r2-orphans.ts](../scripts/cleanup-r2-orphans.ts)         | 基于 Notion 引用集清理 R2 孤儿（dry-run/--apply）                                                     | 阶段一 Step 6 收尾复用                                                         |
| [restore-notion-from-md.ts](../scripts/restore-notion-from-md.ts) | 按 .md 位置回退 Notion 图片块到 s.ee                                                                  | 范式来源（`extractImageUrls`）；阶段一完成后删除，但其位置回写范式已被 D4 吸收 |
| [verify-r2.ts](../scripts/verify-r2.ts)                           | R2 连通性自检                                                                                         | 阶段一 Step 0 复用                                                             |
| [_tmp-scan-taste-covers.ts](../scripts/_tmp-scan-taste-covers.ts) | 临时诊断 taste 封面哈希                                                                               | **删除**（临时脚本）                                                           |

上一次迁移的核心 Bug（来自 restore-notion-from-md.ts 注释）：用 `extractUrlBasename` 取 basename 作 R2 key，而 s.ee 对不同图片复用同一文件名（仅 URL 路径段不同），导致多张不同图折叠到同一 R2 对象，回写后多个图片块都指向第一张图——即「错位」。

> 这一历史决定了：**不能用「反向哈希」把当前 R2-hash URL 映射回 s.ee 链接**（会把错位的块继续映射到错误的图）。必须用 content.prod 的位置真源直接覆盖。见 D4。

### 0.4 当前配置

- `R2_PUBLIC_DOMAIN=https://img.varzy.me`，`R2_KEY_PREFIX=images`
- PRD 指明桶域名为 `cdn.varzy.me`，新图示例也用 `cdn.varzy.me`。统一改用 `cdn.varzy.me`（见 D1）。

---

## 1. 目标与原则

**三个目标**（按优先级）：

1. **（阻塞，最重要）** 把四个 Notion 数据库所有图片迁移到 R2，并**改写 Notion 源数据**（非客户端拼 CDN base）。迁移后线上 Notion 与本地 content 均指向 R2。
2. **（未来，新文章）** `pnpm fetch:posts` 等常规抓取时，新图片自动上传 R2 并回写 Notion，采用全新路径格式。
3. **（调研，最低优先）** 借助 `<img srcset>` + Cloudflare 图片变换，实现按分辨率自适应加载。

**工程原则**：

- **幂等可重入**：任一步骤因网络/限流中断后，直接重跑同一脚本即可继续，不产生重复对象、不产生重复回写。
- **本地缓存优先**：下载阶段先落本地磁盘；上传基于本地缓存，断点续传。
- **dry-run / --apply 双态**：所有写操作脚本默认 dry-run 打印计划，`--apply` 才真正执行。
- **安全闸**：回写 Notion 时逐项断言（如 `ids.length == urls.length`），不匹配则跳过并标记人工复核，绝不盲目错位写入。
- **不可逆动作后置**：删除（清空 R2 孤儿）一律在校验通过后才执行。
- **content.prod 只读**：迁移全程不改动 content.prod，它是真源与回滚依据。

---

## 2. 关键决策

### D1. 公开域名：`cdn.varzy.me` ✅ 已定

- 在 Cloudflare R2 桶上绑定 `cdn.varzy.me`（若尚未绑定），并在 `.env` 将 `R2_PUBLIC_DOMAIN` 改为 `https://cdn.varzy.me`。
- 迁移后所有图片 URL 统一为 `https://cdn.varzy.me/...`；`img.varzy.me` 直接弃用（全站已回退到 s.ee，迁移时统一改为 `cdn.varzy.me`，无旧引用需兼容）。

### D2. legacy 对象 key：`/legacy/<原 s.ee 路径>` ✅ 已定

映射规则：**剥离 s.ee host，前缀 `legacy/`，其余路径原样保留**。

- 源 `https://i.see.you/2026/05/21/jZf0/blog_kotoba_35edc9c0_35fdc9c0-36.webp`
  → R2 key `legacy/2026/05/21/jZf0/blog_kotoba_35edc9c0_35fdc9c0-36.webp`
  → 公开 `https://cdn.varzy.me/legacy/2026/05/21/jZf0/blog_kotoba_35edc9c0_35fdc9c0-36.webp`
- 源 `https://cdn.sa.net/2024/03/15/62zxcBnLbVQrl9I.png`
  → R2 key `legacy/2024/03/15/62zxcBnLbVQrl9I.png`

**跨域冲突**：`cdn.sa.net`（无随机段）与 `i.see.you`（有随机段）路径深度不同、文件名均为 s.ee 全局唯一随机串，host 之后的路径几乎不可能冲突。Step 1 下载阶段仍做一次去重断言（同一 R2 key 出现两次即报错）兜底。备选（更防御）`/legacy/<host>/<原路径>`，仅在断言发现冲突时升级。

> legacy 对象 key **不**经过 `composeR2Key`（它带 `R2_KEY_PREFIX=images`），直接用 `legacy/...` 作完整 key，与未来新图（`{year}/{month}/...`）并存于同桶不同路径。也正因 `/legacy/` 是全新前缀，与旧 `images/` 孤儿无冲突，故无需先清空桶（D5）。

### D3. 下载来源：content.prod 扫描为主，s.ee API 仅校验 ✅ 已定

- content.prod 是「线上正在使用」的精确集合（654 张），下载量最小、无冗余、含 taste `cover`。
- s.ee 的 [GetFileHistory API](https://s.ee/docs/zh-CN/api/GetFileHistory/) 返回账户历史上传过的全部图片（含已不再被引用的），下载量大且多无用图。
- **s.ee API 仅作迁移后完整性校验**：迁移完成后调用一次，比对线上引用的图是否都在 s.ee 历史里（理论上应全在），以及哪些 s.ee 历史图已不再被引用（可日后清理 s.ee 账户）。不作为下载主路径。

### D4. Notion 回写策略：blockId 索引配对（核心，无状态依赖） ✅ 已定

> 背景纠正：页面内**混合状态真实存在**——单个页面里既有报错未改的 s.ee 块、又有成功/错位的 R2-hash 块，无法按页一刀切。故回写策略必须**与块当前状态无关**。

**核心思路：用 blockId 索引配对，绕开一切状态判断与排序风险。** 依据两个已核查事实：

1. content/ 与 content.prod 每页图片数逐页一致 → Notion 块**结构**（数量/嵌套/顺序）自快照以来未变，变的只是 URL。
2. notion-to-md 的 `pageToMarkdown` 返回带 `blockId` 的 `MdBlock` 树（[types/index.d.ts](../node_modules/notion-to-md/build/types/index.d.ts#L22-L27)）。

**算法**：对每个线上页面：

1. 跑 `n2m.pageToMarkdown(pageId)`，**镜像 `toMarkdownString` 向 `.parent` 的展开顺序**遍历 `MdBlock` 树，收集图片块 `blockId` 序列 `ids[]`。
2. 解析 content.prod 对应 .md 正文，按文本顺序取 s.ee 图片 URL 序列 `urls[]`（复用 [restore-notion-from-md.ts](../scripts/restore-notion-from-md.ts) 的 `extractImageUrls`）。
3. 断言 `ids.length == urls.length`；不等则跳过整页 + 标记人工复核。
4. 逐项 `notion.blocks.update(block_id=ids[i], image.external.url=legacy(urls[i]))`。

`ids[i]` ↔ `urls[i]` 成立的依据：`ids` 取自 notion-to-md 自身展开顺序，`urls` 来自同一库生成的 .md 文本顺序，结构又一致 → 顺序必然一致，不依赖手写 DFS。

**遍历镜像规则**（保证 `ids[]` 顺序 == content.prod `.parent` 顺序）：镜像 [notion-to-md 的 `toMarkdownString`](../node_modules/notion-to-md/build/notion-to-md.js#L53) 向 `.parent` 的展开——`synced_block`/`column_list`/`column` 子块内联下钻；`toggle`/`quote`/`callout` 子块下钻；**`child_page` 子块不下钻**（其子块被库输出到独立 key，不在 content.prod `.parent` 中）。

> **唯一已知盲区**：`child_page` 子树内的图片块在 content.prod 里无对应 URL，无法位置配对。处置：Step 0 单独扫描「位于 child_page 子树内的图片块」并标记人工复核（预计极少——child_page 引用的是其它整页，其内通常无内联图片）。`ids.length == urls.length` 断言也会因这类块触发不等而跳过，是天然安全网。

**两类特殊字段**：

- **taste `cover` 属性**（files 属性，非块）：content.prod frontmatter 有 `cover:`（已核查 96 条全有）。1:1 配对：读 frontmatter `cover`（s.ee）→ 写 `pages.update` cover 属性为 `legacy(cover)`。线上 cover 若是 R2-hash 错位也一并覆盖修正。
- **页面级 cover/icon**（`page.cover`/`page.icon`）：content.prod 不含；迁移脚本从未触碰（[image-processor.ts](../scripts/image-processor.ts) 只处理 properties 的 files 与块），故仍为原始 s.ee。直接 host 字符串替换（s.ee host → `cdn.varzy.me/legacy`）。

**为何无纰漏（逐项论证）**：

| 风险                                                 | 为何消除                                                                                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| 页面内混合状态（s.ee + R2-hash + 错位）              | 配对不看当前 URL，只按 `ids[i]` 覆盖 `legacy(urls[i])`。混合天然兼容。                                                                      |
| 排序错位（列/toggle 嵌套导致 .md 顺序 ≠ 手写 DFS）   | `ids` 取自 notion-to-md 自身展开顺序，`urls` 来自同一库生成的 .md 文本顺序；结构一致 → 顺序一致。                                           |
| 重复图（同页两张相同 s.ee URL）                      | `urls` 含两个相同值，`ids` 两个不同 blockId，各配各的，不折叠。                                                                             |
| content.prod 含非 s.ee 外链                          | 已核查全部是 s.ee，无需过滤。                                                                                                               |
| 下载 404（s.ee 原图已删）                            | 回写前查 `urls[i]` ∈ 下载成功集；不在则该块跳过+标记，绝不写指向缺失对象的 URL。                                                            |
| 重复执行 / 中断                                      | `当前 URL == legacy(urls[i])` 则跳过；逐块 `delay(100)`，重跑续上。                                                                         |
| 数量不匹配（罕见：手动增删图 / notion-to-md 漏渲染） | Step 0 预证 + 回写时再断言；不等即跳过整页+人工复核，绝不盲写。                                                                             |
| sha1 键的块（额外保险）                              | 若某块当前 R2 URL 含 16-hex 段，可校验 `sha1(urls[i])[:16]` 是否匹配，不匹配则标记（仅校验、不阻断；basename 旧键不适用，靠数量断言兜底）。 |

**关键前提**：`ids.length == urls.length` 全页成立。有强力间接证据（content/ ↔ content.prod 每页图片数逐页一致），但「线上 Notion 实际块数 == content.prod .md 图片数」需 Step 0 实测坐实（若 notion-to-md 系统性漏渲染某类块，两者都会少、但线上块多 → 审计暴露为不等而跳过，安全）。

### D5. R2 清空：不先清空，迁移完成后清理孤儿 ✅ 已定（偏离 PRD，更安全）

PRD 提议「先清空 R2 桶」。改为**不先清空**：

- `/legacy/` 是全新前缀，与旧 `images/` 哈希对象无路径冲突，先删无收益却把不可逆动作前置。
- 标准安全切换顺序：**上传 `/legacy/` → 回写 Notion → 校验 → 收尾清理旧 `images/` 孤儿**（复用 [cleanup-r2-orphans.ts](../scripts/cleanup-r2-orphans.ts)，此时引用集已全部指向 `/legacy/`，旧对象自然被判为孤儿）。
- 旧对象在迁移期间保留，回写有误时可对照参考。

桶仅本站使用，收尾清理范围即全桶（或限定旧前缀），均安全；cleanup 脚本默认 dry-run。

### D6. 阶段二新图路径格式：方案 C ✅ 已定（见 §4）

---

## 3. 阶段一：迁移存量图片（最重要，解除发新文阻塞）

整体流程为 7 个可独立重跑的步骤（Step 0–6），顺序执行：

```
Step 0  preflight-check      预检：环境/连通性/结构对齐断言（只读）
Step 1  download-see-images   下载 s.ee 图到本地缓存（下载集 = content.prod ∪ 线上 s.ee URL）
Step 2  upload-legacy-to-r2  本地缓存 → R2 /legacy/（不先清空，新前缀无冲突）
Step 3  rewrite-notion-urls  回写 Notion（blockId 索引配对 content.prod 真源，状态无关）
Step 4  verify               抽查 + grep 校验（只读）
Step 5  pnpm sync:all         重建本地 content
Step 6  cleanup-r2-orphans    收尾清理旧 /images/ 哈希孤儿（复用现有脚本）
```

幂等性总表：

| 步骤   | 幂等机制                        | 中断后重跑       |
| ------ | ------------------------------- | ---------------- |
| Step 0 | 全程只读                        | 重跑安全         |
| Step 1 | 本地文件存在即跳过下载          | 重跑只补未完成的 |
| Step 2 | 上传前 HEAD 探测，已存在跳过    | 重跑只传未完成的 |
| Step 3 | 目标 URL == 当前 URL 则跳过回写 | 重跑只写未对齐的 |
| Step 4 | 只读校验                        | 重跑安全         |
| Step 5 | `--full-sync` 重建              | 重跑安全         |
| Step 6 | 引用集判定孤儿，已删不再存在    | 重跑安全         |

### Step 0 — 预检 `preflight-check.ts`（只读）

职责：

1. **环境校验**：`NOTION_API_SECRET`、4 个 `NOTION_*_DATABASE_ID`、`R2_*` 五项、`R2_PUBLIC_DOMAIN` 是否为 `cdn.varzy.me`（否则告警）。
2. **R2 连通性**：复用 [verify-r2.ts](../scripts/verify-r2.ts) 的上传/读取/删除自检。
3. **content.prod 完整性**：扫描 4 个库的 .md，解析全部 s.ee 图片 URL（正文 `![]()` + taste `cover:` frontmatter），输出总数、独立数、按域分布、跨域冲突断言。
4. **结构对齐断言（blockId 配对前提）**：遍历 4 个库全部页面，跑 `n2m.pageToMarkdown` 取图片 blockId 序列 `ids[]`，与 content.prod 对应 .md 的 s.ee URL 序列 `urls[]` 比对，逐页输出 `ids.length == urls.length` 是否成立。**不成立页**记入人工复核清单（Step 3 会跳过）。
5. **页面级 cover/icon s.ee 扫描**：列出线上 `page.cover` / `page.icon` 指向 s.ee 的项（Step 3 走字符串替换单独处理）。
6. **线上 s.ee URL 收集**：收集线上当前仍为 s.ee 的块/属性 URL，并入下载集（与 content.prod 取并集），保证回写后每条 legacy URL 都有 R2 对象。
7. **child_page 子树图片扫描**：标记位于 `child_page` 子树内、无法位置配对的图片块（人工复核）。

输出：一份报告（控制台 + 可选 JSON），含待下载 URL 集（content.prod ∪ 线上 s.ee URL）、逐页结构对齐结果（`ids↔urls` 是否等长）、需人工复核页面/块清单。**全程只读，不改任何数据。**

### Step 1 — 下载 s.ee 图片到本地 `download-see-images.ts`（幂等）

输入：Step 0 解析出的去重 s.ee URL 集 = **content.prod 的 s.ee URL ∪ 线上 Notion 当前的 s.ee URL**（并集保证任意被引用的 s.ee 链接都有本地缓存，回写后必能命中 R2 对象）。

逻辑：

- 本地缓存路径 = `tmp/see-cache/<R2 legacy key>`（即 `tmp/see-cache/legacy/2026/.../foo.webp`，与 R2 key 一致，便于 Step 2 直接映射）。
- **幂等**：本地文件已存在且大小 > 0 则跳过。
- 下载失败（404/超时）记入失败表 `tmp/see-cache/_failures.json`，不中断整体；结尾汇报，可重跑只补失败项。
- 并发数 ≤ 3，加 `User-Agent`、`cache: 'no-cache'`（与 [r2-uploader.ts](../scripts/r2-uploader.ts) 的 fetch 头一致）。
- 持续 404（s.ee 已删原图）需人工介入：从 Wayback/本地其它备份恢复，或接受缺失并在 Notion 标注。**这是唯一可能需要人工的环节**，预计极少。

输出：本地缓存目录 `tmp/see-cache/` 全部图片 + 失败表。

> 先落本地而非「下载即上传」：解耦下载与上传，任一环节中断都可独立续跑；上传 R2 与回写 Notion 都基于稳定本地文件/真源，不受 s.ee 在线状态二次波动影响。

### Step 2 — 上传至 R2 /legacy/ `upload-legacy-to-r2.ts`（幂等）

- 遍历 `tmp/see-cache/` 下所有文件，R2 key = 文件相对路径（即 `legacy/...`）。
- **幂等**：上传前 `HeadObjectCommand` 探测（复用 [r2-uploader.ts](../scripts/r2-uploader.ts) 的 `is404`），已存在则跳过。
- `Content-Type` 由扩展名推断（复用 [r2-uploader.ts](../scripts/r2-uploader.ts) 的 `getContentType`）。
- 上传后抽样 GET 公开 URL 校验字节一致。失败记表，可重跑。

输出：R2 桶 `legacy/` 下对象清单与公开 URL。

### Step 3 — 回写 Notion `rewrite-notion-urls.ts`（dry-run / --apply，核心）

> 实现见 D4 的 blockId 索引配对策略。此处给出可执行步骤与安全闸。

对 4 个库每个页面：

1. **取线上 blockId 序列**：`n2m.pageToMarkdown(pageId)` → 镜像 `toMarkdownString` 展开顺序遍历 `MdBlock` 树，收集图片块 `blockId` 序列 `ids[]`。
2. **取真源 URL 序列**：解析 content.prod 对应 .md 正文，按文本顺序取 s.ee 图片 URL 序列 `urls[]`。
3. **断言** `ids.length == urls.length`。不等 → 跳过整页 + 记入人工复核清单。
4. **下载门**：对每个 `i`，要求 `urls[i]` ∈ Step 1 下载成功集；否则**该块跳过+标记**。
5. **回写**：目标 = `https://cdn.varzy.me/legacy/<urls[i] 去 s.ee host 后的路径>`。若 `当前 URL == 目标` 跳过（幂等）；否则 `notion.blocks.update(block_id=ids[i], image.external.url=目标)`，每项 `delay(100)`。
6. **sha1 校验（可选保险）**：若 `ids[i]` 块当前 R2 URL 含 16-hex 段，校验 `sha1(urls[i])[:16]` 是否匹配；不匹配标记（仅校验不阻断；basename 旧键不适用）。
7. **taste `cover` 属性**：读 content.prod frontmatter `cover`（s.ee），断言非空且为 s.ee → 目标 = `legacy(cover)` → `pages.update` cover 属性。幂等跳过。
8. **页面级 cover/icon**：读线上 `page.cover`/`page.icon`，若为 s.ee → host 字符串替换 → `pages.update`。幂等跳过。

通用安全闸：

- 仅当目标 URL 确为 `https://cdn.varzy.me/legacy/...` 形态才写（绝不写过期 Notion 签名 file URL、绝不写裸 s.ee）。
- 全程 dry-run 优先：先打印全部 `from → to` + 每页 `ids↔urls` 配对表，`--apply` 才回写。

输出：回写统计（页数、变更数、跳过数、人工复核页/块清单、sha1 校验异常清单）。

### Step 4 — 校验 `verify`（只读）

- 抽查若干 Notion 页面，图片块/cover 均为 `https://cdn.varzy.me/legacy/...`。
- 抽查若干 R2 公开 URL 可访问、字节与本地缓存一致。
- 复核人工清单是否已处理。

### Step 5 — 重建本地 content

```
pnpm sync:all
```

`--full-sync` 全量重建本地 `content/`。重建后本地 .md 图片 URL 应全部变为 `https://cdn.varzy.me/legacy/...`。grep 验收：

```
grep -rhoE "https://(i\.see\.you|cdn\.sa\.net|sm\.ms)[^ )]*\.(jpg|jpeg|png|gif|webp)" content/ | wc -l   # 期望 0
```

### Step 6 — 收尾清理 R2 孤儿

复用 [cleanup-r2-orphans.ts](../scripts/cleanup-r2-orphans.ts)（默认 dry-run，`--apply` 才删）：

- 引用集此时已全部指向 `cdn.varzy.me/legacy/...`，旧 `images/` 哈希对象自然被判为孤儿。
- 批量删除孤儿（每批 1000）。不可逆删除后置到校验通过之后。

### 阶段一验收清单

- [ ] R2 桶 `legacy/` 下对象数 = 654（或 Step 0 统计的去重数）。
- [ ] 本地 `content/` 不再含任何 s.ee 域图片 URL（grep 为 0）。
- [ ] 抽查若干 Notion 页面，图片块 URL 均为 `https://cdn.varzy.me/legacy/...`。
- [ ] 人工复核页清单为空（或已逐页处理）。
- [ ] 站点本地 `pnpm dev` 图片正常显示。

---

## 4. 阶段二：新文章图片自动上传（新路径格式）

### 4.1 路径格式：方案 C ✅ 已定

PRD 提案 `/{year}/{month}/{label}/{page_id}/{hash或block_id}.{ext}` 的两点不足：完整 `page_id` 入路径冗长且暴露内部 ID；`hash或block_id` 二选一含糊。采用方案 C：

```
/{year}/{month}/{label}/{pageIdShort}/{contentHash}.{ext}
```

示例：`https://cdn.varzy.me/2026/08/posts/458e1ef3/3bcdc9c0a1f2e8d4.webp`

- `pageIdShort` = page_id 去横线前 8 位（kotoba/taste 抓取脚本已在用，见 [fetch-taste.ts](../scripts/fetch-taste.ts) 的 `getConvertIdentifier`）。比完整 UUID 短、不暴露全量 ID，又能按页归组。
- `contentHash` = 文件字节 sha1 前 16 位。**同页同图**去重（同图同页多次引用 → 同一对象）；跨页同图各存一份（可接受小冗余，换取 R2 列表里按页归属的可读性）。
- 对象生命周期由 Notion 引用集管理，孤儿清理沿用 [cleanup-r2-orphans.ts](../scripts/cleanup-r2-orphans.ts) 的引用扫描。
- `{year}/{month}` 取值：页面 `date` 属性（posts）/ `published_time`（kotoba）/ `last_edited_time` 的年月（taste/pages），路径稳定且与文章时间线一致。

> 相对方案 A（`/{year}/{month}/{label}/{contentHash}.{ext}`，跨页去重、URL 更短但无页面归属）：你选择方案 C，看重按页归组的可读性与调试便利，接受跨页同图的少量冗余。

### 4.2 与现有抓取流程的集成

阶段二**无需新脚本**，改造现有流程：

1. **命名函数**：在 [image-uploader.ts](../scripts/image-uploader.ts) 新增 `composeNewImagePath(pageId, label, date)`，按方案 C 生成路径；`generateFileName`（随机时间戳）逐步弃用。
   - 内容 hash 需在下载拿到字节后计算，命名时机从「下载前」移到「下载后」——`uploadExternal` 内部先 fetch、再算 hash、再 PutObject。幂等检查改为「下载后算 hash → 拼 key → HEAD 探测 → 命中则跳过 PutObject（仍返回该 URL）」。
2. **常规流程**：[image-processor.ts](../scripts/image-processor.ts) 的非 migrate 分支已负责上传未托管图并回写 Notion，沿用，仅把文件名生成换成方案 C。`isHostedUrl` 此时只需判 `isR2Url`（阶段一完成后 Notion 已无 s.ee 链接，可移除 `isSmmsUrl` 子句，见 [r2-uploader.ts](../scripts/r2-uploader.ts) 注释）。
3. **provider 固定 r2**：`getImageUploaderProvider()` 返回 `'r2'`（已是），smms-uploader 保留为可删代码。

### 4.3 阶段二验收

- 新建测试 Notion 文章插入若干外部图，`pnpm fetch:posts` 后：
  - Notion 图片块 URL 变为 `https://cdn.varzy.me/{year}/{month}/posts/{pageIdShort}/{hash}.{ext}`。
  - 本地 .md 同步更新。
  - 重复抓取同一篇，R2 不产生新对象（HEAD 命中跳过）。
  - 同一图在同一篇文章内多次引用 → R2 仅 1 个对象（方案 C 同页去重）。

---

## 5. 阶段三：srcset + Cloudflare 图片变换（调研与方案）

### 5.1 能力现状

- **R2 本身不变换图片**：经自定义域名直接 serve 原始对象。
- **Cloudflare Image Resizing**（Pro 及以上套餐含一定额度）可在边缘按需变换，通过 Worker 子请求 `fetch(url, { cf: { image: { width, fit, quality, format: 'auto' } } })` 实现；`format: 'auto'` 按 `Accept` 头返回 WebP/AVIF。
- 独立产品 **Cloudflare Images**（上传+变换+托管）是另一套托管模型，与「R2 自有对象」不符，不推荐。

### 5.2 推荐方案：Worker 网关 + `cf.image`

在 `cdn.varzy.me` 前部署 Worker（或挂子路由）：

- 收到 `GET https://cdn.varzy.me/<path>?w=640` 等，从 R2 取原始对象（或回源 R2 自定义域名），用 `cf.image` 按查询参数变换。
- 响应设 `Cache-Control: public, max-age=31536000, immutable`（所有图片一旦上传即不可变——legacy 是 s.ee 原图、新图是内容寻址——可激进缓存）。

### 5.3 前端改造点

[LightboxImage.tsx](../src/app/_components/LightboxImage.tsx) 当前是裸 `<img>`，MDX 把 `img` 映射到它（见 [MdxRenderer.tsx](../src/app/_components/MdxRenderer.tsx)）。改造：

- 对 R2 图片 URL，输出 `<img srcset="...?w=640 640w, ...?w=1024 1024w, ...?w=1920 1920w" sizes="(max-width: 768px) 100vw, 768px" src="...?w=1024" loading="lazy">`。
- lightbox 全尺寸图仍用原图（无 `?w=`）。

### 5.4 备选：上传时预生成多尺寸

在 image-processor 上传时额外生成 640/1024/1920 三档存入 R2（如 `{hash}_640w.webp`），前端 srcset 指向固定对象。**优点**：无 Worker、无运行时变换成本、无套餐要求。**缺点**：存储 ×3、legacy 存量图需补跑一次批量生成。对个人博客，这其实是更省心的路线。

> 阶段三为最低优先级，建议在阶段一、二完成、站点稳定运行后再启动。两条路线（Worker 变换 vs 预生成）届时据套餐与维护偏好二选一。

---

## 6. 旧脚本清理与目录收敛

阶段一完成后处理 `scripts/`：

| 脚本                                                                  | 处置                                                                                                        |
| --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `_tmp-scan-taste-covers.ts`                                           | **删除**（临时诊断，已完成使命）                                                                            |
| `migrate-smms-to-r2.ts`                                               | **删除**（被阶段一新脚本取代）                                                                              |
| `restore-notion-from-md.ts`                                           | **删除**（位置回写范式已被 D4 吸收；其 `extractImageUrls` 工具函数迁入新回写脚本）                          |
| `cleanup-r2-orphans.ts`                                               | **保留**（长期用于孤儿清理收尾）                                                                            |
| `verify-r2.ts`                                                        | **保留**（诊断工具）                                                                                        |
| 阶段一新脚本（preflight / download / upload-legacy / rewrite-notion） | 阶段一完成后：保留 preflight 与 rewrite 作为可复跑运维脚本；download/upload-legacy 可归档或保留以备回滚重跑 |
| `smms-uploader.ts`                                                    | 阶段二稳定后**删除**（含 `isSmmsUrl`）；在此之前保留过渡                                                    |

收敛后 `scripts/` 应只剩：fetch 流程（4 个 fetch + notion-database-fetcher + notion-to-md + image-processor + image-uploader + r2-uploader）、cleanup-r2-orphans、verify-r2，以及阶段一保留的运维脚本。临时文件全部清退。

---

## 7. 风险与回滚

| 风险                                  | 缓解                                                                                                                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 误删 R2 数据                          | 桶仅本站用；Step 6 用 cleanup-r2-orphans dry-run 先审，删除后置于校验通过后                                                                                                                                         |
| s.ee 原图已删（下载 404）             | Step 1 失败表隔离，重跑只补失败项；持续 404 单独人工恢复                                                                                                                                                            |
| content.prod 与线上 Notion 数量不匹配 | Step 0 预检出清单；Step 3 逐页断言跳过+标记，不错位写                                                                                                                                                               |
| Notion 限流                           | 回写 `delay(100)`；脚本可中断重跑                                                                                                                                                                                   |
| 回写后发现个别图错位                  | content.prod 未动，重跑 Step 3 即按 `ids[i]` 再次覆盖修正                                                                                                                                                           |
| 整体回滚需求                          | content.prod 只读是真源；R2 可重传；Notion 可用 Step 3 的同款配对逻辑把目标从 `legacy(urls[i])` 改回 `urls[i]`（即 s.ee 原链）来回滚——范式已内化于回写脚本，不依赖被删的 restore 脚本。仅在确认 s.ee 仍可用时才回滚 |

回滚通道始终存在（content.prod 只读 + R2 可重建 + Notion 可位置回写），阶段一可放心推进。

---

## 8. 已确认事项 ✅

1. **桶域名**：统一 `cdn.varzy.me`，弃用 `img.varzy.me`。需在 Cloudflare 绑定并把 `.env` 的 `R2_PUBLIC_DOMAIN` 改为 `https://cdn.varzy.me`。（D1）
2. **桶用途**：仅本站使用，Step 6 收尾可清理全桶旧对象。（D5）
3. **新图路径**：阶段二采用方案 C（`/{year}/{month}/{label}/{pageIdShort}/{contentHash}.{ext}`，按页归组 + 同页去重）。（§4.1）
4. **下载来源**：content.prod 扫描为主，s.ee API 仅迁移后完整性校验。（D3）
5. **回写策略**：blockId 索引配对，状态无关，混合页面兼容。（D4）
6. **清空方式**：不先清空，迁移完成后清理孤儿。（D5）

决策已定，下一步进入阶段一脚本实现。建议从 Step 0 预检起步——它给出待下载清单、逐页结构对齐结果、需人工复核清单，是后续所有步骤的输入，也是 D4 唯一待实测坐实的前提（`ids.length == urls.length` 全页成立）。
