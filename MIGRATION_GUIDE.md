# 项目迁移指南

本项目已从基于 Notion API 的 SSR 模式升级为基于本地 MDX 文件的 SSG 模式。

## 环境配置

确保你的 `.env` 文件包含以下变量：

```env
NOTION_DATABASE_ID=your_notion_database_id_here
NOTION_API_SECRET=your_notion_api_secret_here
SMMS_API_TOKEN=your_smms_api_token_here
API_CALLING_TOKEN=your_api_calling_token_here
```

## 新的构建流程

### 1. 安装依赖

```bash
pnpm install
```

### 2. 拉取内容

从 Notion 拉取最新文章到本地：

```bash
npm run fetch
```

此命令会：

- 从 Notion Database 获取所有已发布的文章
- 检查本地文件是否存在和是否需要更新
- 将 Notion 页面转换为 MDX 格式
- 保存到 `content/posts/` 目录

### 3. 开发模式

```bash
npm run dev
```

注意：开发模式会自动执行 `npm run fetch` 来确保内容是最新的。

### 4. 构建生产版本

```bash
npm run build
```

此命令会：

1. 先执行 `npm run fetch` 获取最新内容
2. 然后执行 `next build` 生成静态站点

## 目录结构变化

```
├── content/
│   ├── posts/
│   │   ├── post-1.mdx
│   │   ├── post-2.mdx
│   │   └── ...
│   └── .last-fetch          # 上次拉取时间戳
├── scripts/
│   ├── fetch-posts.ts       # 主要的拉取脚本
│   ├── notion-to-mdx.ts     # Notion 到 MDX 转换器
│   └── types.ts             # 类型定义
└── src/
    └── app/
        └── (blog)/
            └── _lib/
                └── content-loader.ts  # 本地内容加载器
```

## 主要变化

1. **渲染模式**：从 SSR + ISR 改为 SSG（静态站点生成）
2. **内容来源**：从运行时 Notion API 调用改为构建时本地 MDX 文件
3. **构建流程**：采用两阶段构建（fetch → build）
4. **缓存策略**：移除运行时缓存，使用静态文件缓存

## 增量更新机制

脚本会自动检查文章的 `last_edited_time` 与上次拉取时间，只更新有变化的文章：

- 新文章：自动拉取
- 已修改文章：检测到 `last_edited_time` 变化后重新拉取
- 未变化文章：跳过拉取，提高效率

## 故障排除

### 1. 拉取失败

如果 `npm run fetch` 失败，检查：

- Notion API 凭证是否正确
- 网络连接是否正常
- Notion Database 权限是否充足

### 2. 构建失败

如果构建失败，检查：

- 是否先执行了 `npm run fetch`
- MDX 文件格式是否正确
- 依赖是否安装完整

### 3. 内容不显示

如果内容不显示，检查：

- `content/posts/` 目录是否存在文件
- MDX 文件的 frontmatter 格式是否正确
- 文章的 `status` 是否为 `Published`

## 开发建议

1. **定期拉取**：在开发过程中定期执行 `npm run fetch` 来同步最新内容
2. **版本控制**：`content/` 目录已添加到 `.gitignore`，不会被提交到版本控制
3. **环境变量**：确保生产环境中正确配置了 Notion API 相关的环境变量
