# HOMEPAGE-NEXT

我的个人主页 [varzy.me](https://varzy.me)，欢迎访问。

根目录是 Next.js 应用，`scripts/` 从 Notion 同步网站内容。各 CLI 和内部包由 pnpm workspace 管理。

- `@zy/image-compression` 负责压缩、HEIC 转码、EXIF 朝向和 Ultra HDR gain map 处理。
- `@zy/notion-images` 调用压缩包处理 Notion 图片，上传至 R2 并回写 URL。网站同步脚本和 no2tg2 共用这套流程。
- `no2tg2` 从 Notion 队列取下一篇待发布页面，发送到 Telegram 频道。
- `imgtiny` 只依赖本地压缩管线，支持批量压缩和目录监听。

内部包通过 `workspace:*` 链接，由 CLI 直接加载 TypeScript 源码。共用依赖的版本范围定义在 `pnpm-workspace.yaml` 的 catalog 中。

## 常用命令

```bash
pnpm install --frozen-lockfile
pnpm dev          # 本地开发
pnpm fetch:all    # 从 Notion 拉取全部内容（每小时 CI 也会跑）
pnpm check        # 检查整个 workspace 的格式、lint、类型和测试
pnpm no2tg        # 发布 Notion 队列中的下一篇到 Telegram
pnpm imgtiny:compress --input <dir> [--output <dir>]
```

单独检查某个包用 `pnpm --filter <pkg> run exam`。格式化用 `pnpm --filter <pkg> run format`。

网站同步读取根目录的 `.env`，no2tg2 读取 `packages/no2tg2/.env`。两个目录都有 `.env.example`，GitHub Actions 通过 secrets 注入同名变量。
