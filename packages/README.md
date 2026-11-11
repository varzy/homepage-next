# Packages

- `@zy/image-compression`: 负责压缩、HEIC 转码、EXIF 朝向和 Ultra HDR gain map 处理。
- `@zy/notion-images`: 调用压缩包处理 Notion 图片，上传至 R2 并回写 URL。网站同步脚本和 no2tg2 共用这套流程。
- `no2tg2`: 从 Notion 队列取下一篇待发布页面，发送到 Telegram 频道。
- `imgtiny`: 只依赖本地压缩管线，支持批量压缩和目录监听。

需要保证每个 package 都暴露一个 `exam` 命令用于做全局的代码检查。
