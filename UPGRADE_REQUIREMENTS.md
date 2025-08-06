# Next.js 个人主页项目升级需求文档

## 项目概述

将现有的基于 Notion API 的 SSR 博客系统升级为基于本地 MDX 文件的 SSG 静态站点生成系统，以解决 Notion API 调用次数限制问题，并提升网站性能。

## 当前架构分析

### 现有技术栈
- **前端框架**: Next.js 14.2.11 (App Router)
- **渲染模式**: SSR (服务端渲染) + ISR (增量静态再生，revalidate: 300)
- **内容管理**: Notion API + Notion Database
- **Markdown 处理**: `notion-to-md` + `react-markdown`
- **样式**: Tailwind CSS + @tailwindcss/typography
- **图片处理**: SM.MS 图床

### 当前数据流
1. **构建时**: 使用 `generateStaticParams()` 生成有限数量的静态页面
2. **运行时**: 通过 Notion API 实时获取文章内容和元数据
3. **缓存策略**: 使用 `unstable_cache` 和 ISR 进行缓存

## 目标架构设计

### 新技术栈
- **前端框架**: Next.js 14.2.11 (App Router)
- **渲染模式**: SSG (静态站点生成)
- **内容管理**: 本地 MDX 文件 + Frontmatter
- **Markdown 处理**: `@next/mdx` + MDX 组件
- **样式**: 保持现有 Tailwind CSS 配置
- **构建流程**: 两阶段构建 (`npm run fetch` → `npm run build`)

### 新数据流
1. **内容获取阶段** (`npm run fetch`):
   - 从 Notion Database 拉取文章列表和元数据
   - 检查 `last_edited_time` 决定是否需要更新
   - 将 Notion 页面转换为 MDX 文件存储到本地
   - 记录拉取时间用于增量更新

2. **构建阶段** (`npm run build`):
   - 读取本地 MDX 文件
   - 生成所有静态页面
   - 完全静态化，无运行时 API 调用

## 详细需求规范

### 1. 项目配置更新

#### 1.1 Next.js 配置升级
```javascript
// next.config.mjs
import createMDX from '@next/mdx'
import remarkGfm from 'remark-gfm'

const nextConfig = {
  output: 'export', // 启用静态导出
  trailingSlash: true, // 为静态站点添加尾斜杠
  images: {
    unoptimized: true // 静态导出时禁用图片优化
  },
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  experimental: {
    mdxRs: false // 使用稳定的 MDX 编译器
  }
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
    rehypePlugins: []
  }
})

export default withMDX(nextConfig)
```

#### 1.2 依赖包更新
**新增依赖**:
- `@next/mdx`: MDX 支持
- `remark-gfm`: GitHub Flavored Markdown 支持
- `gray-matter`: Frontmatter 解析
- `glob`: 文件匹配

**移除依赖**:
- `react-markdown`: 改用 MDX 原生支持
- `notion-to-md`: 替换为自定义转换逻辑

### 2. 内容获取脚本 (`npm run fetch`)

#### 2.1 脚本功能
创建 `scripts/fetch-posts.ts` 脚本，实现以下功能：

```typescript
interface FetchConfig {
  notionDatabaseId: string;
  notionApiSecret: string;
  outputDir: string; // 默认: 'content/posts'
  lastFetchFile: string; // 默认: '.last-fetch'
}

interface PostMetadata {
  title: string;
  category: string;
  type: string;
  status: string;
  tags: string[];
  date: string;
  slug: string;
  summary: string;
  last_edited_time: string;
  notion_id: string;
}
```

#### 2.2 增量更新逻辑
1. **读取上次拉取时间**:
   ```typescript
   const lastFetchTime = readLastFetchTime('.last-fetch')
   ```

2. **查询需要更新的文章**:
   ```typescript
   // 查询所有已发布的文章
   const allPosts = await getAllNotionPosts()

   // 筛选需要更新的文章
   const postsToUpdate = allPosts.filter(post =>
     !lastFetchTime ||
     new Date(post.last_edited_time) > new Date(lastFetchTime) ||
     !fs.existsSync(`content/posts/${post.slug}.mdx`)
   )
   ```

3. **批量处理更新**:
   ```typescript
   for (const post of postsToUpdate) {
     const mdxContent = await convertNotionToMDX(post)
     await saveMDXFile(post.slug, mdxContent)
     console.log(`✅ Updated: ${post.title}`)
   }
   ```

4. **更新拉取时间戳**:
   ```typescript
   await saveLastFetchTime('.last-fetch', new Date().toISOString())
   ```

#### 2.3 MDX 文件格式
```mdx
---
title: "文章标题"
category: "Coding"
type: "Post"
status: "Published"
tags: ["React", "Next.js"]
date: "2024-01-01"
slug: "article-slug"
summary: "文章摘要"
last_edited_time: "2024-01-01T12:00:00.000Z"
notion_id: "notion-page-id"
---

# 文章标题

文章内容...

```jsx
// MDX 组件示例
<CustomComponent prop="value" />
```
```

### 3. MDX 集成实现

#### 3.1 目录结构
```
content/
  posts/
    article-1.mdx
    article-2.mdx
    ...
  .last-fetch
src/
  app/
    (blog)/
      _lib/
        mdx-utils.ts      # MDX 文件处理工具
        content-loader.ts # 内容加载器
      _components/
        MDXContent.tsx    # MDX 内容渲染组件
```

#### 3.2 内容加载器
```typescript
// src/app/(blog)/_lib/content-loader.ts
export interface PostMeta {
  title: string;
  category: string;
  type: string;
  status: string;
  tags: string[];
  date: string;
  slug: string;
  summary: string;
  last_edited_time: string;
  notion_id: string;
}

export async function getAllPosts(): Promise<PostMeta[]>
export async function getPostBySlug(slug: string): Promise<PostMeta | null>
export async function getPostsByCategory(category: string): Promise<PostMeta[]>
export async function getPostsByTag(tag: string): Promise<PostMeta[]>
export async function getAllTags(): Promise<string[]>
```

#### 3.3 MDX 组件配置
```typescript
// src/app/(blog)/_components/MDXContent.tsx
import { MDXRemote } from 'next-mdx-remote/rsc'

const mdxComponents = {
  h1: (props: any) => <h1 className="..." {...props} />,
  h2: (props: any) => <h2 className="..." {...props} />,
  // 保持现有的代码高亮组件
  code: CustomCodeBlock,
  // 自定义组件
  CustomComponent,
}

export default function MDXContent({ source }: { source: string }) {
  return <MDXRemote source={source} components={mdxComponents} />
}
```

### 4. 路由和页面更新

#### 4.1 文章详情页
```typescript
// src/app/(blog)/posts/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map(post => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  // 返回元数据
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  const MDXContent = await import(`@/content/posts/${params.slug}.mdx`)

  return (
    <BlogPageContainer pageHero={{ /* ... */ }}>
      <MDXContent.default />
    </BlogPageContainer>
  )
}
```

#### 4.2 分类和标签页面
更新所有相关页面使用新的内容加载器，移除 Notion API 调用。

### 5. 构建和部署配置

#### 5.1 脚本配置
```json
// package.json
{
  "scripts": {
    "fetch": "tsx scripts/fetch-posts.ts",
    "build:content": "npm run fetch",
    "build": "npm run build:content && next build",
    "build:static": "npm run build && next export"
  }
}
```

#### 5.2 环境变量
保持现有的 Notion API 相关环境变量，用于内容获取阶段。

### 6. 性能优化

#### 6.1 图片处理
- 保持现有的 SM.MS 图床集成
- 在 `npm run fetch` 阶段处理图片上传
- MDX 文件中使用优化后的图片 URL

#### 6.2 缓存策略
- 移除运行时缓存逻辑
- 在构建时生成所有必要的静态资源
- 利用 CDN 缓存静态文件

### 7. 向后兼容性

#### 7.1 URL 结构
保持现有的 URL 结构不变：
- `/posts/[slug]`
- `/categories/[category]/[[...page]]`
- `/tags/[tag]/[[...page]]`

#### 7.2 样式和组件
- 保持现有的 Tailwind CSS 配置
- 保持现有的 prose 样式
- 保持现有的组件接口

### 8. 开发体验

#### 8.1 开发流程
1. **内容更新**: `npm run fetch` 获取最新内容
2. **本地开发**: `npm run dev` 启动开发服务器
3. **构建部署**: `npm run build` 生成静态站点

#### 8.2 错误处理
- 在 `fetch` 脚本中添加详细的错误日志
- 对于获取失败的文章提供降级处理
- 添加内容验证和格式检查

## 实施计划

### 阶段一：基础设施搭建
1. 更新 Next.js 配置和依赖
2. 创建内容获取脚本框架
3. 设计 MDX 文件结构和 Frontmatter 格式

### 阶段二：内容迁移
1. 实现 Notion 到 MDX 的转换逻辑
2. 批量迁移现有文章
3. 测试内容的正确性和完整性

### 阶段三：页面重构
1. 更新所有页面组件使用本地内容
2. 替换 Notion API 调用为本地文件读取
3. 测试所有路由和功能

### 阶段四：优化和部署
1. 性能优化和构建配置调优
2. 部署配置和 CI/CD 更新
3. 全面测试和上线

## 风险评估

### 技术风险
- **MDX 兼容性**: 确保 Notion 内容能正确转换为 MDX 格式
- **构建性能**: 大量 MDX 文件可能影响构建速度
- **图片处理**: 图片迁移过程中可能出现丢失或损坏

### 缓解措施
- 分阶段实施，每个阶段都有回滚方案
- 保留原有 Notion API 集成作为备份
- 充分测试内容转换的准确性
- 建立自动化测试确保功能完整性

## 注意事项

1. **环境变量**: 确保在 `npm run fetch` 执行时能够访问到必要的 Notion API 凭证
2. **增量更新**: `last_edited_time` 的比较逻辑需要考虑时区和精度问题
3. **错误恢复**: 当 Notion API 调用失败时，应该有合适的重试和降级机制
4. **内容验证**: 转换后的 MDX 文件需要验证格式正确性和内容完整性
5. **部署流程**: CI/CD 流程需要支持两阶段构建（fetch + build）

## 总结

通过这次升级，项目将从依赖运行时 API 调用的 SSR 模式转换为完全静态化的 SSG 模式，不仅解决了 Notion API 调用限制的问题，还将显著提升网站的加载性能和稳定性。同时，通过增量更新机制，确保内容同步的效率和准确性。
