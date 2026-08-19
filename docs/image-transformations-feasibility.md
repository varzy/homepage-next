# Cloudflare Image Transformations 可行性分析

> 面向「图片已全量迁移至 R2、经 `cdn.varzy.me` 提供」的现状，评估用 Cloudflare Image Transformations 实现压缩 + 响应式多分辨率加载的可行性、方案与风险。
>
> 结论先行：**三项需求全部可行，推荐「纯 URL 改写」方案（无 Worker、仅改渲染层）**。详见 §5。

---

## 1. 背景与目标

| #   | 目标            | 含义                                                                                          |
| --- | --------------- | --------------------------------------------------------------------------------------------- |
| 1   | 源真相不变      | Notion 数据库与 `content/` 本地 markdown 里，图片地址永远是 `cdn.varzy.me` 下的**原始图**链接 |
| 2   | 代码层自动压缩  | 在代码层把图片链接自动接入 Image Transformations，实现格式协商 / 质量压缩等                   |
| 3   | srcset 多分辨率 | 基于 `srcset` 自动按视口宽度加载不同尺寸，移动端小图、PC 端大图                               |

---

## 2. 当前架构关键事实（来自代码探索）

这些事实决定了方案边界：

- **静态导出站**：`next.config.mjs` 为 `output: 'export'` + `images: { unoptimized: true }`。**Next 自带图片优化完全关闭，运行时无任何后端**。所有图片优化必须发生在「URL 层 / CDN 层」，而不是 Next。
- **全站原生 `<img>`，零 `next/image`**。渲染路径有两个：
  - [LightboxImage.tsx](src/app/_components/LightboxImage.tsx) —— 唯一的 markdown 内图片 chokepoint。[MdxRenderer.tsx](src/app/_components/MdxRenderer.tsx) 把 MDX 的 `img` 映射到它，因此**每一篇 markdown 里的 `![alt](url)` 都走这里**；Kotoba 图片网格也走它。
  - [TasteCard.tsx](<src/app/(pages)/taste/_components/TasteCard.tsx>) —— taste 列表封面用裸 `<img>`，是另一条独立路径。
  - [LightboxProvider.tsx](src/app/_components/LightboxProvider.tsx) —— 点击放大时打开**原始全尺寸 `src`**。
- **URL 在同步阶段就写死**：`scripts/image-processor.ts` 在 Notion→markdown 同步时把图传到 R2，并**回写到 Notion 块 / 页属性**；`content/` 里的 markdown 直接含 `https://cdn.varzy.me/...` 字面量。**运行时无任何 URL 改写**，`src/utils/url.ts` 只做 tag 解码，与图片无关。
- **R2 配置硬编码**（[r2-uploader.ts](scripts/r2-uploader.ts)）：bucket=`homepage`，公开域名=`https://cdn.varzy.me`，host=`cdn.varzy.me`（`isR2Url` 做精确 host 匹配）。
- **两套 key 共存**：当前 `content/` 里 **655 条**全是 `legacy/{年月日}/{4位id}/{原文件名}`；新设计的 `public/{年月}/{label}/{pageId}/{sha1}.{ext}`（`composeNewImageKey`）已接好但尚未启用。两者都在 `cdn.varzy.me` 下，**单一改写规则可同时覆盖**。
- **无任何 `srcset`/`sizes`/`width`/`height` 逻辑**。这是本次要补的缺口。
- **遗留散链**：[readme/page.tsx:21-24](<src/app/(pages)/readme/page.tsx#L21-L24>) 直接硬编码了两条 `https://cdn.sa.net/...`（s.ee）URL，**未迁移到 R2**，无法走 Transformations（见 §9）。
- **git 历史里已有旧"阶段三"规划**（`26b9f32:docs/migrate-image-to-r2-implementation.md` §5），提了 Worker 网关（`cf.image`）与预生成两种思路——见 §5 对比。

---

## 3. Cloudflare Image Transformations 机制速览

- **URL 格式**（同 zone 路径相对形式，最干净）：
  ```
  https://cdn.varzy.me/cdn-cgi/image/<options>/<原始路径>
  ```
  例：原始 `https://cdn.varzy.me/legacy/2024/01/01/ab01/photo.jpg`
  → 变换 `https://cdn.varzy.me/cdn-cgi/image/width=1024,quality=80,format=auto/legacy/2024/01/01/ab01/photo.jpg`
- **`<options>` 为逗号分隔的 `key=value`**，常用：`width` / `height` / `dpr` / `fit` / `quality` / `format` / `gravity` / `anim` / `metadata`。
  - `format=auto`：按浏览器 `Accept` 头协商 AVIF / WebP，压缩率最高，且对 legacy 混杂的 `.jpg/.png/.webp` 统一有利。
  - `quality`：默认 ~85，照片建议 80；含文字的截图可酌情提高。
  - `metadata=none`：剥离 EXIF，更小、更隐私。
- **源站放行**：Cloudflare「永远放行与变换同 zone 的源站」。你已确认 `cdn.varzy.me` 是 varzy.me 同 zone 上的 R2 自定义域名 → **无需在 Sources 里额外添加源站**，零配置即可起跑。
- **缓存与计费**：变换结果在边缘缓存；**每个「源图 × 参数组合」每月首次请求计为 1 次唯一变换**，之后命中缓存不再计费。
  - **Free 套餐每月含 5,000 次唯一变换**；超出后新变换返回 `9422` 错误（**已缓存照常服务，不产生费用**）。
  - 付费 Images 计划：前 5,000 含，超出 `$0.50 / 1,000`，**无硬上限、不会 9422**。

> ⚠️ 关于 `format=auto` 的计费口径存在文档歧义：乐观看「`format=auto` 是一个参数值 → 每个尺寸算 1 个唯一变换」；悲观看「AVIF 与 WebP 是两份不同的缓存输出 → 各算 1 个」。本分析按**悲观口径**估算（更稳）。

---

## 4. 三项目标逐项可行性

### 目标 1：源真相保持原始链接 —— ✅ 天然满足

变换**只发生在渲染层的 URL 拼接**，`content/` 与 Notion 里的字面量始终是原始 `cdn.varzy.me/<path>`，不写入任何 `cdn-cgi` 路径。这与你现有的「同步期写死 URL、运行时零改写」架构完全兼容，**不需要任何数据回写或迁移**。

### 目标 2：代码层自动压缩 —— ✅ 可行

在渲染层把 `https://cdn.varzy.me/<path>` 改写为 `https://cdn.varzy.me/cdn-cgi/image/quality=80,format=auto,metadata=none/<path>` 即可。因静态导出，改写在 **SSG 构建期**完成并固化进静态 HTML，运行时零成本。

### 目标 3：srcset 多分辨率 —— ✅ 可行

`srcset` 每个候选即一条独立的变换 URL（不同 `width=`），浏览器按视口自动选：

```html
<img
  src="https://cdn.varzy.me/cdn-cgi/image/width=1024,quality=80,format=auto/legacy/.../photo.jpg"
  srcset="
    https://cdn.varzy.me/cdn-cgi/image/width=640,quality=80,format=auto/legacy/.../photo.jpg   640w,
    https://cdn.varzy.me/cdn-cgi/image/width=1024,quality=80,format=auto/legacy/.../photo.jpg 1024w,
    https://cdn.varzy.me/cdn-cgi/image/width=1920,quality=80,format=auto/legacy/.../photo.jpg 1920w
  "
  sizes="(max-width: 768px) 100vw, 768px"
  loading="lazy"
/>
```

`sizes` 取决于布局：正文列宽上限约 768px，故上式「移动端 100vw、桌面端 768px」是合理默认。

---

## 5. 推荐方案：纯 URL 改写（无 Worker）

### 5.1 为什么不沿用旧规划里的 Worker 网关

旧 `阶段三` 的 Option A 用 Worker + `fetch(url, { cf: { image } })` 做网关。它有两个问题：

1. `cf.image` 的 Worker 绑定属于更老的 **Image Resizing**，历史上绑 Pro+ 套餐，与你的 **Free 套餐**不一定兼容；
2. 多一层 Worker 基础设施，且需要把 `cdn.varzy.me` 的请求绕进 Worker 再回源，增加链路。

纯 URL 改写方案（直接产出 `/cdn-cgi/image/<opts>/<path>`）**不依赖 Worker、不依赖套餐**，构建期拼好字符串即可，运行时由 Cloudflare 自动变换+缓存。**这是 Free 套餐下最省、最稳的路径**。

### 5.2 改动面（仅渲染层，3 处）

| 文件                                                               | 改动                                                                                                                                 |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| 新增 `src/utils/image-transform.ts`（建议）                        | 集中放 `isCdnUrl(url)` / `transformUrl(url, opts)` / `buildSrcset(url, widths)` / `buildSizes()`。所有 URL 拼接逻辑只此一处。        |
| [LightboxImage.tsx](src/app/_components/LightboxImage.tsx)         | 对 `cdn.varzy.me` 的 `src`：渲染用 `transformUrl` + `buildSrcset`；**放大图 `open(originalSrc)` 仍用原始全尺寸**（不压缩，保清晰）。 |
| [TasteCard.tsx](<src/app/(pages)/taste/_components/TasteCard.tsx>) | 封面 `<img>` 同样接入 srcset（cover 场景 `sizes` 可更小）。                                                                          |
| [MdxRenderer.tsx](src/app/_components/MdxRenderer.tsx)             | 无需改逻辑，`img: LightboxImage` 映射不变，自动受益。                                                                                |

非 R2 链接（如 readme 的 s.ee 散链、外部图）**原样透传**，避免误改写。

### 5.3 它如何满足"源真相不变"

markdown / Notion 不动一行；改写纯粹是组件渲染时的纯函数变换，回滚只需删掉 `transformUrl` 调用。

---

## 6. 待解决的技术细节（需在实现阶段定）

1. **尺寸与 CLS（最大开放问题）**：纯 srcset 不带 `width/height` 时，图片加载前不占高 → 累积布局偏移（CLS）。三档处理：
   - **MVP**：先不填尺寸，配合 CSS `aspect-ratio` 或接受轻微 CLS。已能达成"移动端加载小图"主目标。
   - **增强 A**：构建期对每张图请求一次 `/cdn-cgi/image/format=json/<path>` 取 `{width,height}` 烘进 HTML。655 张图 = 655 次构建期抓取（可缓存到 `image-dims.json`，增量更新）。
   - **增强 B（最干净，长线）**：在 [image-processor.ts](scripts/image-processor.ts) 上传时（手上有原始字节）就量出尺寸，随 key 一起记进一个 `manifest` 或写进 frontmatter，渲染层直接读。这与 phase-2 `public/` key 方案天然契合。
2. **宽度阶梯**：建议固定 `[640, 1024, 1920]`（或 `[480, 800, 1280, 1920]`）。**用固定集合、不让任意宽度进 URL**，是控制"唯一变换数"与配额的关键。
3. **`sizes` 取值**：正文默认 `(max-width: 768px) 100vw, 768px`；封面/网格按实际列宽给。
4. **lightbox 放大图**：保持原始 `cdn.varzy.me/<path>` 全尺寸（或可选拉一个 `width=2400` 大变体），**不进 srcset**。
5. **错误兜底**：Free 配额超限会返回 `9422`。建议 `<img>` 加 `onerror` 回退到原始非变换 URL（或 `width=1920` 大档），保证图不会"白掉"。
6. **参数默认值**：建议 `quality=80, format=auto, metadata=none`；带文字的 UI 截图可走更高 quality 或保留 PNG——可先全局 80，后续按需分档。
7. **格式协商对小图的影响**：极小图标/截图转 webp/avif 可能使文字偏软，需真机抽样后再定档。

---

## 7. 成本与配额风险（Free 套餐）

按**悲观口径**（AVIF/WebP 各算 1 个唯一变换）估算冷启动首月：

```
655 张图 × 3 档宽度 × 2 格式 ≈ 3,930 次唯一变换
```

- 月 5,000 配额下**理论上够，但余量很薄**（仅约 1,070）。真实流量还会因为不同视口触发不同档位、爬虫等增加变体；某些月可能触顶。
- **触顶后果可控**：仅"当月尚未生成过的新变体"返回 `9422`，**已缓存的照常服务、不扣费**；下月额度重置即恢复。
- **缓解**：① 宽度档位保持 3 档以内；② 启用 `format=auto` 而非显式 avif+webp 双发，争取落到"每尺寸 1 个"乐观口径；③ `onerror` 兜底回退原图，杜绝白图。
- **破上限路径**：升级到付费 Images 计划后超出按 `$0.50/1000` 计费、无硬上限、不再 9422。按 4k 变体/月算基本仍在免费档内；即便翻倍到 8k，超量也仅约 `$1.5/月`。**结论：成本不构成障碍，Free 可作起点，付费兜底极廉价。**

---

## 8. 里程碑建议

- **M1 MVP（不改数据、可灰度）**：新增 `image-transform.ts`，改 `LightboxImage` + `TasteCard`，固定 `[640,1024,1920]` + `format=auto,quality=80` + `sizes` 默认值 + `onerror` 兜底。lightbox 保原图。本地构建验证 `cdn-cgi/image` URL 正确、移动/桌面分别命中不同档。
- **M2 防 CLS**：二选一——构建期 `format=json` 抓尺寸 + 缓存 manifest；或上传期量尺寸写 manifest（与 phase-2 key 启用一起做更顺）。
- **M3 收尾**：迁移 readme 的 s.ee 散链到 R2；按真机抽样调 quality/格式档；若常触顶再决定是否升付费档。

---

## 9. 边界与例外

- **readme 散链**（`cdn.sa.net`）：非 R2，无法变换。M3 迁移后再纳入，或保持原样透传。
- **legacy vs public key**：两套 key 都在 `cdn.varzy.me` 下，单一规则覆盖；但 legacy 保留原始文件名（含 `.png/.jpg/.webp` 混杂），`format=auto` 统一协商正好受益。
- **markdown 外部图片**：若将来引入非 CDN 的外链图，`isCdnUrl` 守卫确保只改自家图，外链原样透传。

---

## 10. 待你确认的决策点

1. **MVP 是否先不填尺寸**（接受轻微 CLS），还是要一步到位上构建期 `format=json` 抓尺寸？
2. **宽度阶梯**采用 `[640,1024,1920]` 还是更细/更粗？
3. **lightbox 放大图**用原始全尺寸，还是拉一个 `width=2400` 大变体（省一点原图带宽、但更清晰度受限）？
4. 质量是否全局 `80`，UI 截图是否单独分档？

确认后即可进入实现方案设计（届时再动代码）。

---

_相关历史文档：`git show 26b9f32:docs/migrate-image-to-r2-implementation.md`（§5 阶段三，思路可参照但方案以本文件为准）。_
