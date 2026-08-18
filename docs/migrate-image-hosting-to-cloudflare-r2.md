# 图床迁移评估：SMMS（s.ee）→ Cloudflare R2

> 评估将本站图床从 SMMS（现 s.ee，`https://s.ee`）迁移至 Cloudflare R2 自建图床的可行性、改造方案与实施步骤。

## 一、结论先行

**完全可行，且推荐迁移。** 现有架构与 R2 的契合度很高，核心改造集中在 [scripts/smms-uploader.ts](../scripts/smms-uploader.ts) 一个文件，[image-processor.ts](../scripts/image-processor.ts) 几乎无需改动逻辑。迁移可分阶段进行、风险可控，且 R2 的零出口流量费用 + 自定义域名对本站这种「写入低频、读取高频」的博客场景几乎是为之量身定制。

## 二、现状梳理

在评估迁移前，先厘清当前图床是如何接入的，这决定了改造的最小切入点。

### 2.1 整体数据流

本站内容托管在 Notion，通过 `pnpm fetch:all`（见 [package.json](../package.json) 的 `scripts.fetch:all`）将 Notion 数据库拉取为本地 Markdown。在拉取过程中，[NotionImageProcessor](../scripts/image-processor.ts) 会处理每篇文章中的图片：

1. 遍历 Notion 页面的所有 block（含递归子块）以及 page property 中的 `files` 类型字段；
2. 对每张图片判断是否「需要上传」：
   - Notion 托管图片（`image.type === 'file'`）→ 需要上传；
   - 外部图片（`image.type === 'external'`）→ 若 URL 命中 SMMS 域名列表则跳过，否则需要上传；
3. 需要上传的图片：先下载，再上传到 SMMS，拿到 SMMS URL 后**回写 Notion block 的 `external.url`**；
4. 后续再次拉取时，由于 URL 已是 SMMS 域名，会被 `isSmmsUrl` 判定为「已托管」而跳过，避免重复上传。

> 关键点：图片 URL 最终是写进 Notion 的，本地 Markdown 不直接持有图片二进制。这意味着「迁移」本质上是**改写上传目标 + 决定如何处理历史 URL**。

### 2.2 SMMS 接入细节（[scripts/smms-uploader.ts](../scripts/smms-uploader.ts)）

| 项目         | 现状                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| API 基址     | `https://s.ee/api/v1/file`                                                                                |
| 鉴权         | `Authorization: <token>`（无 `Bearer` 前缀），token 来自环境变量 `SMMS_API_TOKEN`                         |
| 上传字段     | FormData 字段名 `smfile`                                                                                  |
| 文件大小限制 | **5MB**（代码中硬编码校验 `fileBlob.size > 5 * 1024 * 1024`）                                             |
| 去重机制     | 服务端按 hash 去重，命中时返回 `code: 'image_repeated'` 与一个已存在的 URL                                |
| 返回结构     | 成功返回 `data.url`；重复返回 `images` 字段；失败返回 `code` + `message`                                  |
| 已识别域名   | `cdn.sa.net`、`sm.ms`、`see.you`、`fs.to` 等多个（见 `SMMS_URLS` 数组）                                   |
| 调用方       | [image-processor.ts](../scripts/image-processor.ts) 的 `processImageBlock` 与 `processPageFileProperties` |

### 2.3 环境变量（[.env.example](../.env.example)）

当前仅 `SMMS_API_TOKEN` 一项与图床相关。

## 三、SMMS vs Cloudflare R2 对比

| 维度               | SMMS（s.ee）                                   | Cloudflare R2                                          |
| ------------------ | ---------------------------------------------- | ------------------------------------------------------ |
| 出口流量（egress） | 受限于平台策略                                 | **免费（$0）**，不限量                                 |
| 存储成本           | 平台托管，不透明                               | 10GB/月免费，超出约 $0.015/GB·月                       |
| 写操作（Class A）  | 受频率限制                                     | 100 万次/月免费                                        |
| 读操作（Class B）  | 受频率限制                                     | 1000 万次/月免费                                       |
| 单文件大小上限     | 5MB                                            | 单次 PUT 5GB，分片可达 5TB                             |
| 数据所有权         | 第三方托管，存在跑路/政策风险                  | 完全自有，S3 兼容，可随时导出                          |
| 自定义域名         | 受限于平台域名列表                             | 可绑定自有域名（如 `img.varzy.me`），走 Cloudflare CDN |
| 链接稳定性         | 依赖平台域名不更换（历史上 s.ee 多次更换域名） | 自有域名，永久稳定                                     |
| 去重               | 服务端自动去重                                 | 无内置去重，需自行实现（可选）                         |
| 接入复杂度         | 简单（单一 HTTP 接口）                         | 中等（S3 SDK + 凭证 + 域名配置）                       |

> 本站特点：图片**写入只在 fetch 时发生**（低频），**读取发生在每次访客访问页面**（高频）。R2「写少量免费、读海量免费、egress 免费」的计费模型与本站画像高度吻合，正常情况下成本将无限趋近于 $0。

## 四、迁移方案设计

### 4.1 核心思路：引入 Provider 抽象，保留现有处理流程

[NotionImageProcessor](../scripts/image-processor.ts) 的「下载 → 上传 → 回写 Notion」流程与具体图床无关，唯一耦合 SMMS 的地方是它直接调用了 `smmsUploadExternal` / `getSmmsUrl` / `isSmmsUrl` 三个函数。

因此改造的关键动作是：**把这三个函数收敛为一个 `ImageUploader` 接口，让 SMMS 与 R2 各自实现，按环境变量切换。** 这样 `image-processor.ts` 的主体逻辑零改动，未来再换图床也只是新增一个实现。

```ts
// 拟新增的抽象（示意，非最终代码）
interface ImageUploader {
  // 下载外部图片并上传，返回最终的公开访问 URL
  uploadExternal(url: string, fileName: string): Promise<string>;
  // 判断 URL 是否已托管在本图床（用于跳过重复上传）
  isHostedUrl(url: string): boolean;
}
```

### 4.2 R2 上传实现要点

R2 提供 S3 兼容 API，在 Node/tsx 脚本环境中最稳妥的方式是使用 `@aws-sdk/client-s3`，将其 endpoint 指向 R2：

```ts
// 示意
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

// 上传：key 即为对象路径，公开 URL = 自定义域名 + key
await r2.send(
  new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: fileName, // 例：posts_blog-slug_1234567890.jpg
    Body: fileBlob,
    ContentType: 'image/...',
  }),
);
// 返回 URL：https://img.varzy.me/<fileName>
```

相比 SMMS 的几点差异需要注意：

- **无需 5MB 限制校验**：R2 单次 PUT 支持 5GB，可移除 `smms-uploader.ts` 中那段硬编码的大小检查（或放宽）。
- **无 `image_repeated` 去重**：SMMS 服务端按 hash 去重并返回已存在 URL，R2 不会。若需去重，可在本地维护一个 `{hash → key}` 的映射，或干脆不做（存储便宜，重复上传代价极低）。**建议第一版不做去重**，保持简单。
- **URL 即拼接得出**：上传成功后无需解析响应体取 `data.url`，直接 `自定义域名 + Key` 即可。
- **公开访问方式**：推荐绑定自定义域名（如 `img.varzy.me`），设置 bucket 为公开读或经 Cloudflare 代理。也可用 R2 自带的 `pub-xxx.r2.dev`，但自定义域名更稳定、可缓存。

### 4.3 代码改造清单

| 文件                                                          | 改动                                                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `scripts/image-uploader.ts`（新增）                           | 定义 `ImageUploader` 接口                                                                  |
| `scripts/r2-uploader.ts`（新增）                              | R2 实现：`uploadExternal`、`isHostedUrl`                                                   |
| `scripts/smms-uploader.ts`（保留/适配）                       | 适配 `ImageUploader` 接口，作为 fallback                                                   |
| [scripts/image-processor.ts](../scripts/image-processor.ts)   | 注入 `ImageUploader` 依赖，替换对 `smmsUploadExternal`/`getSmmsUrl`/`isSmmsUrl` 的直接调用 |
| [scripts/notion-to-md.ts](../scripts/notion-to-md.ts)         | 构造 `NotionImageProcessor` 时传入选定的 uploader                                          |
| [scripts/fetch-*.ts](../scripts/fetch-pages.ts)（4 个）       | 根据环境变量实例化 R2 或 SMMS uploader                                                     |
| [.env](../.env) / [.env.example](../.env.example)             | 新增 R2 相关变量（见 4.4），`SMMS_API_TOKEN` 标记为可选                                    |
| [tests/smms-uploader.test.ts](../tests/smms-uploader.test.ts) | 补充 R2 uploader 的单测；保留 SMMS 测试                                                    |

### 4.4 环境变量变更

新增：

```bash
# Cloudflare R2
R2_ACCOUNT_ID=            # Cloudflare 账户 ID（在 R2 控制台可见）
R2_ACCESS_KEY_ID=         # R2 API Token 的 Access Key ID
R2_SECRET_ACCESS_KEY=     # R2 API Token 的 Secret Access Key
R2_BUCKET_NAME=           # bucket 名称，如 homepage-images
R2_PUBLIC_DOMAIN=         # 绑定的自定义域名，如 https://img.varzy.me
```

`SMMS_API_TOKEN` 保留但不再必需（仅当回退到 SMMS 或历史迁移脚本需要时使用）。

### 4.5 历史图片迁移策略（关键决策）

现有 Notion 中已有大量 `*.sm.ms` / `cdn.sa.net` 等域名的图片 URL。迁移期有两种策略，**建议采用方案 A（分阶段）**：

#### 方案 A：分阶段（推荐）

- **阶段一**：切换新上传到 R2。将 `isHostedUrl` 同时识别 R2 域名**和** SMMS 域名列表，使两类 URL 都被判为「已托管」而跳过。新文章的图片走 R2，旧文章的 SMMS 图片保持原样继续可用。
- **阶段二（可选，后续）**：编写一次性迁移脚本，遍历所有 Notion block/property 中的图片，对 SMMS 域名的图片逐张下载 → 上传到 R2 → 回写 Notion URL。可复用现有 `NotionImageProcessor` 的机器，只需把「需要上传」的判定改为「URL 是 SMMS 域名」。

优点：风险低，先验证 R2 链路通畅再处理存量；即使阶段二不做，站点也完全正常。

#### 方案 B：一次性全量迁移

直接在切换当天把所有 SMMS 图片也搬到 R2 并回写。优点是干净彻底；缺点是工作量大、出错需回滚，且 s.ee 一旦限频会拖慢迁移。

> 无论哪种方案，**迁移完成后都不必删除 SMMS 上的图片**——保留作为冷备即可，待确认 R2 稳定运行一段时间后再清理。

## 五、实施步骤

### 5.1 R2 侧准备（Cloudflare 控制台）

1. 创建 R2 bucket（如 `homepage-images`）。
2. 生成 R2 API Token，获得 `Access Key ID` 与 `Secret Access Key`。
3. （推荐）绑定自定义域名 `img.varzy.me` 到该 bucket，并在 Cloudflare DNS 增加对应 CNAME。
4. 确认公开访问：通过 `https://img.varzy.me/<test-key>` 能取到测试对象。

### 5.2 代码侧实施

1. 新增 `scripts/image-uploader.ts`（接口）与 `scripts/r2-uploader.ts`（实现），并补充单测。
2. 让 `scripts/smms-uploader.ts` 适配同一接口（薄封装，保留现有函数签名）。
3. 改造 [image-processor.ts](../scripts/image-processor.ts)：构造函数注入 `ImageUploader`，内部用 `uploader.isHostedUrl` 替代 `isSmmsUrl`、用 `uploader.uploadExternal` 替代 `smmsUploadExternal + getSmmsUrl`。
4. 在 [fetch-*.ts](../scripts/fetch-pages.ts) 中按环境变量选择并注入 uploader。
5. 更新 [.env.example](../.env.example) 与本地 [.env](../.env)。
6. 运行 `pnpm exam`（format + lint + typecheck + test）确保通过。
7. 用一篇**新建的测试文章**触发 `pnpm fetch:posts`，确认图片成功上传到 R2 且 URL 已回写 Notion。

### 5.3 阶段二（可选，迁移存量）

1. 编写迁移脚本 `scripts/migrate-smms-to-r2.ts`，遍历四个数据库的 Notion 页面，对 `isSmmsUrl` 命中的图片执行「下载 → 上传 R2 → 回写」。
2. 加 `--dry-run` 预览待迁移图片数量与列表。
3. 先小批量（单篇文章）验证，再全量执行。
4. 迁移后核查：随机抽查若干文章，确认图片正常显示。

## 六、风险与注意事项

- **凭证安全**：`R2_SECRET_ACCESS_KEY` 等同于图床写权限，务必加入 `.gitignore`（现有 [.env](../.env) 已被忽略即可），Vercel/CI 环境变量也需正确配置。
- **自定义域名 DNS**：若 `varzy.me` 主域不在 Cloudflare 托管，需额外配置 CNAME；若已在 Cloudflare，配置极简。
- **Notion API 限频**：回写 Notion block 仍受 Notion 速率限制，现有 `delay(100)` 缓解措施保留即可。
- **存量图片数量**：阶段二迁移前先跑 `--dry-run` 统计数量与总大小，估算耗时（s.ee 有下载频率限制，大批量可能需要分批 + 重试）。
- **去重丢失**：R2 无服务端去重，同名 key 会覆盖。现有 `generateFileName` 含时间戳 + 随机串，碰撞概率极低，无需额外处理。
- **不可逆性**：回写 Notion URL 后，若需回滚到 SMMS，需重新上传回 SMMS。建议阶段一验证充分再进入阶段二。

## 七、成本估算

按本站规模（个人博客，文章量百级、单篇图片个位数）粗估：

- 存储：全部图片总计通常远低于 10GB → **$0**。
- 写操作（仅在 fetch 时上传新图）：每月极少 → **$0**。
- 读操作（访客浏览触发图片加载）：每月几十万次 → 远低于 1000 万 → **$0**。
- 出口流量：**$0**。

**结论：迁移后常态成本为 $0。** 唯一可能产生费用的场景是单篇文章图片极多且被高频访问（读操作超 1000 万/月），对本站不现实。

## 八、后续可选优化

- 上传时自动压缩 / 转 WebP：在 `r2-uploader.ts` 中接入 `sharp`，减少存储与传输体积。
- 客户端缓存：通过 Cloudflare Page Rules 或 R2 对象元数据设置长 `Cache-Control`，进一步降低读操作计次。
- 懒加载占位图 / LQIP：与前端结合，提升图片密集页面的加载体验。
- 备份策略：定期用 `rclone`（S3 兼容）将 R2 bucket 备份到其他存储，进一步降低单点风险。
