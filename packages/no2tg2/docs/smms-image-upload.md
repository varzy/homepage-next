# 图片自动压缩与 SM.MS 图床上传 — 实施文档

## 一、需求背景

当前项目（no2tg2）的图片处理流程为：从 Notion 提取图片 URL → 下载 → 压缩 → 发送到 Telegram。问题是 Notion 托管的图片 URL 具有时效性，过期后无法访问。

本次改造目标：在发送到 Telegram 之前，将图片压缩后上传到 SM.MS 图床，并将 Notion 页面中的原始图片地址替换为 SM.MS 的永久地址。改造后 Telegram 将直接从 SM.MS CDN 下载图片。

## 二、整体流程

```
main.ts 执行流程（改造后）：

queryReadyPage()
    │
    ▼
processPageImages(page.id)          ← 新增步骤
    │  ├── 遍历页面所有 blocks
    │  ├── 找到 image 类型的 block
    │  ├── 下载图片（Notion 托管 或 外部 URL）
    │  ├── 压缩图片（sharp）
    │  ├── 上传到 SM.MS
    │  └── 更新 Notion block（替换为 SM.MS 外部 URL）
    │
    ▼
getPageContent(page.id)             ← 此时图片 URL 已变为 SM.MS 地址
    │
    ▼
formatMessage()                     ← 不变
    │
    ▼
sendToChannel()                     ← 从 SM.MS 下载图片（已有压缩 + 上传逻辑不变）
    │
    ▼
markAsPublished()                   ← 不变
```

## 三、新增模块

### 3.1 `src/smms.ts` — SM.MS API 封装

参考 `scripts/smms-uploader.ts`，移植并适配当前项目。

**核心函数：**

```typescript
// SM.MS API 基础地址
const SMMS_BASE_URL = 'https://s.ee/api/v1/file';

// 上传结果类型
type SmmsUploadResult = SmmsUploadSuccess | SmmsUploadRepeat | SmmsUploadError;

// 上传 Buffer 到 SM.MS
async function smmsUpload(fileBuffer: Buffer, fileName: string): Promise<SmmsUploadResult>

// 从 URL 下载图片并上传到 SM.MS（整合下载 + 上传）
async function smmsUploadFromUrl(url: string, fileName: string): Promise<SmmsUploadResult>

// 从上传结果中提取 SM.MS URL（处理 success 和 image_repeated 两种情况）
function getSmmsUrl(result: SmmsUploadResult): string | null

// 检查 URL 是否已经是 SM.MS 地址（避免重复上传）
function isSmmsUrl(url: string): boolean

// 生成上传文件名
// 格式: no2tg2_{blockId前8位}_{timestamp}.{ext}
function generateFileName(url: string, blockId: string): string
```

**关键差异（与参考代码对比）：**

| 项目 | 参考代码 (scripts/) | 本项目 (src/) |
|------|---------------------|---------------|
| 文件参数类型 | `Blob` | `Buffer`（与 sharp 压缩输出一致） |
| 日志 | `console.log` | `logger`（pino） |
| Token 来源 | `process.env.SMMS_API_TOKEN` | `config.smms.apiToken` |
| 代理 | 无（依赖全局） | 无额外处理（main.ts 已调用 `applyGlobalProxyForFetch`） |
| 图片前缀 | `blog`/`posts`/`pages` | `no2tg2` |

**完整类型定义：**

```typescript
type SmmsUploadSuccess = {
  success: true;
  code: string;
  data: {
    width: number;
    height: number;
    filename: string;
    storename: string;
    size: number;
    path: string;
    hash: string;
    url: string;     // 图片永久链接
    delete: string;  // 删除链接
    page: string;
  };
};

type SmmsUploadRepeat = {
  success: false;
  code: 'image_repeated';
  images: string;    // 已存在的图片 URL（可直接使用）
};

type SmmsUploadError = {
  success: false;
  code: string;
  message: string;
};
```

### 3.2 `src/image-processor.ts` — 图片处理编排器

参考 `scripts/image-processor.ts` 的 `NotionImageProcessor` 类，适配当前项目的流程。

**核心职责：** 编排"下载 → 压缩 → 上传 SM.MS → 更新 Notion block"的完整流水线。

**关键函数：**

```typescript
/**
 * 处理页面中的所有图片
 * 1. 遍历所有 blocks（含分页、含嵌套子 block）
 * 2. 对于 image 类型的 block：
 *    - Notion 托管图片（file 类型）：下载 → 压缩 → 上传 SM.MS → 更新 block
 *    - 外部图片（external 类型）：检查是否已是 SM.MS → 是则跳过，否则同上流程
 * 3. 调用 notion.blocks.update() 将图片从 file 类型转为 external 类型
 */
async function processPageImages(pageId: string): Promise<ImageProcessingStats>

// 处理单个图片 block 的内部实现
async function processImageBlock(block: BlockObjectResponse): Promise<void>
```

**处理结果统计：**

```typescript
interface ImageProcessingStats {
  total: number;      // 页面中的图片总数
  processed: number;  // 成功上传并更新的数量
  skipped: number;    // 已为 SM.MS 地址，跳过的数量
  errors: number;     // 处理失败的数量
}
```

**压缩参数（复用 `compress.ts`）：**
- 最大尺寸：1920 × 1920（超出等比缩放）
- JPEG 质量：80（mozjpeg 编码器）
- PNG 质量：80
- GIF：跳过压缩，直接上传原始文件
- SM.MS 文件大小限制：5MB（压缩后超过此限制会报错）

**SM.MS 上传失败处理：**
- 记录错误日志（含 block ID 和原始 URL）
- 保留原始图片 URL（不更新 Notion block），该图片在 Telegram 中仍可正常使用
- 继续处理后续图片，不中断整体流程

**Notion API 频率限制：**
- 每次上传成功后延时 100ms（SM.MS 限制）
- 使用 `notionClient.blocks.update()` 更新图片 block，将 `image.type` 从 `'file'` 改为 `'external'`

## 四、现有模块改动

### 4.1 `src/config.ts`

新增 `smms` 配置段：

```typescript
export const config = {
  notion: { /* 不变 */ },
  telegram: { /* 不变 */ },
  smms: {
    apiToken: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',  // SM.MS API Token
  },
} as const;
```

### 4.2 `src/main.ts`

在 `release()` 函数中，`getPageContent()` 调用之前插入图片处理步骤：

```typescript
async function release(): Promise<void> {
  // ... queryReadyPage() ...（不变）

  // 新增：处理页面中的图片（压缩 + 上传 SM.MS + 替换 Notion 地址）
  logger.info('正在处理页面图片...');
  const imageStats = await processPageImages(page.id);
  logger.info(
    { total: imageStats.total, processed: imageStats.processed,
      skipped: imageStats.skipped, errors: imageStats.errors },
    '图片处理完成',
  );

  // ... getPageContent() ...（不变，此时图片 URL 已更新为 SM.MS 地址）
  // ... 后续流程不变 ...
}
```

### 4.3 `src/telegram.ts`

**无需修改。** `downloadImageForUpload` 中的压缩步骤仍然保留。由于图片已经过 SM.MS 上传前的压缩，Telegram 侧的二次压缩实际效果微小（输入已接近目标质量），不会造成明显劣化。

### 4.4 `src/compress.ts`

**无需修改。** `compressImage(buffer, filename)` 的接口已满足需求，`image-processor.ts` 直接调用即可。

## 五、错误处理矩阵

| 场景 | 处理策略 |
|------|----------|
| SM.MS token 未配置 | 启动时 `logger.warn` 警告，跳过图片处理，继续后续流程（图片保留原始 URL） |
| 单个图片下载失败 | 记录错误，跳过该图片，继续处理其他图片 |
| 图片超过 5MB（压缩后） | 记录错误，跳过该图片，保留原始 URL |
| SM.MS 上传失败 | 记录错误，保留原始图片 URL，继续处理其他图片 |
| SM.MS 返回 `image_repeated` | 视为成功，使用返回的已有 URL 更新 Notion block |
| Notion block 更新失败 | 记录错误（图片已上传成功，但 Notion 未更新，需手动处理） |
| 全部图片处理失败 | 不影响主流程，消息正常发送（使用原始图片 URL） |

## 六、配置与依赖

### 新增依赖

无需新增依赖。已有 `sharp`（上次改动已安装）、`@notionhq/client`（已有）。

### SM.MS Token 获取

1. 注册/登录 [sm.ms](https://sm.ms/)
2. 进入 Dashboard → API Token
3. 将 Token 填入 `src/config.ts` 的 `smms.apiToken` 字段

## 七、文件清单

| 操作 | 文件 | 说明 |
|------|------|------|
| **新增** | `src/smms.ts` | SM.MS API 封装（上传、URL 提取、文件名生成） |
| **新增** | `src/image-processor.ts` | 图片处理编排（下载→压缩→上传→更新 block） |
| 修改 | `src/config.ts` | 新增 `smms.apiToken` 配置 |
| 修改 | `src/main.ts` | 在 `getPageContent` 前插入 `processPageImages` 调用 |
| 不变 | `src/compress.ts` | — |
| 不变 | `src/telegram.ts` | — |
| 不变 | `src/notion.ts` | — |
| 不变 | `src/formatter.ts` | — |

## 八、验证方案

由于 SM.MS 上传涉及外部 API 调用和 Notion block 更新（有副作用），建议按以下步骤验证：

1. **类型检查**：`pnpm typecheck` 确保无类型错误
2. **单元测试**：为 `src/smms.ts` 中的纯函数（`getSmmsUrl`、`isSmmsUrl`、`generateFileName`）编写测试
3. **集成测试**（手动）：
   - 在 Notion 中创建一个测试页面，添加一张图片，状态设为 "Ready"
   - 运行 `pnpm release`
   - 验证：Notion 页面中的图片 block 已变为外部链接（SM.MS URL）
   - 验证：Telegram 频道中正常显示图片
4. **边界测试**（手动）：
   - 测试超过 5MB 的图片（确认错误日志正常，流程不中断）
   - 测试已为 SM.MS URL 的外部图片（确认被跳过，不重复上传）
   - 测试包含多张图片的页面（确认全部处理，有 100ms 间隔）
