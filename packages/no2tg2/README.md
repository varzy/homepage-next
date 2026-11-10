# NO2TG2

每次运行从 Notion 队列取一篇 Ready 页面，处理图片后发送到 Telegram，发送成功后将页面标记为 Published。

本地运行时，按照 `.env.example` 在本目录配置 `.env`，然后从仓库根目录运行 `pnpm no2tg`。也可以在 GitHub Actions 手动触发 **no2tg2 Release**，它通过仓库 secrets 读取同名变量。
