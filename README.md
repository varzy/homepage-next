# HOMEPAGE-NEXT

我的个人主页 [varzy.me](https://varzy.me)，欢迎访问。

pnpm monorepo：根目录是 Next.js app，公共代码与独立工具在 `packages/` 下。

- `packages/shared`（`@zy/shared`）— R2 上传、图片压缩管线（HEIC 转码 / Ultra HDR gain map 剥离 / EXIF 朝向）、Notion 图片处理器，三端共用，直接以 TS 源码被消费（无构建产物）
- `packages/no2tg2` — 从 Notion 队列取待发布页面，处理图片后发到 Telegram 频道
- `packages/imgtiny` — 本地批量图片压缩 CLI（`*_compressed.*`），支持上传 sm.ms

## 常用命令

```bash
pnpm dev          # 本地开发
pnpm fetch:all    # 从 Notion 拉取全部内容（每小时 CI 也会跑）
pnpm exam         # format + lint + typecheck + test
pnpm no2tg        # 发布 Notion 队列中的下一篇到 Telegram
pnpm imgtiny:compress --input <dir> [--output <dir>]  # 本地批量压缩图片
```

子包各自有 `exam`：`pnpm --filter <pkg> exam`。

环境变量：根 `.env`（Notion / R2）、`packages/no2tg2/.env`（Notion / Telegram / R2）、`packages/imgtiny/.env`（`SMMS_TOKEN`），均已 gitignore；CI 通过 workflow secrets 注入。
