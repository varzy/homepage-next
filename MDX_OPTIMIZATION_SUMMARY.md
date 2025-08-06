# MDX 组件渲染逻辑优化总结

## 优化目标

简化 MDX 组件渲染逻辑，采用统一的 markdown 风格，减少自定义配置，提高可维护性。

## 主要变更

### 1. 简化 `MDXContent.tsx`

**优化前**：
- 包含大量自定义标签映射（h1-h6, p, ul, ol, li, a, img, blockquote, table 等）
- 每个标签都有特定的样式类

**优化后**：
- 只保留必要的自定义组件：`code` 和 `pre`
- 其他标签使用默认的 markdown 渲染
- 依赖 Tailwind CSS 的 `@tailwindcss/typography` 插件提供统一的样式

```typescript
// 简化的 MDX 组件映射，只保留必要的自定义组件
export const mdxComponents = {
  // 代码高亮是唯一需要特殊处理的组件
  code: CustomCodeBlock,

  // 预格式化文本处理
  pre: (props: any) => <div {...props} />,
};
```

### 2. 集中管理自定义组件

**新的架构**：
- `MDXContent.tsx`：只负责基础的代码高亮组件
- `mdx-components.tsx`：集中管理所有自定义组件映射

```typescript
// 全局 MDX 组件配置 - 在这里集中管理所有自定义组件
const globalMdxComponents = {
  // 继承基础的代码高亮组件
  ...baseMdxComponents,

  // 如果需要添加更多自定义组件，可以在这里扩展
  // 例如：
  // CustomAlert: (props: any) => <div className="alert" {...props} />,
  // CustomButton: (props: any) => <button className="btn" {...props} />,
};
```

### 3. 简化组件使用

**优化前**：
```typescript
<MDXRemote source={content} components={mdxComponents} />
```

**优化后**：
```typescript
<MDXRemote source={content} />
```

现在 MDX 组件通过 `useMDXComponents` 函数自动应用，无需手动传递。

## 优势

### 1. **简化维护**
- 减少了大量重复的样式配置
- 集中管理自定义组件，便于维护和扩展

### 2. **统一样式**
- 依赖 `@tailwindcss/typography` 提供一致的 markdown 样式
- 保持 prose 类的完整功能

### 3. **更好的扩展性**
- 在 `mdx-components.tsx` 中添加新的自定义组件更加便捷
- 支持项目级别的全局组件配置

### 4. **性能优化**
- 减少了不必要的组件包装
- 使用默认渲染提高性能

## 保留的自定义功能

1. **代码高亮**：继续使用 `react-syntax-highlighter` 进行语法高亮
2. **样式容器**：保持 `MDXContent` 组件作为样式容器，应用 prose 类

## 使用指南

### 添加新的自定义组件

如果需要添加新的自定义组件，只需在 `src/mdx-components.tsx` 中扩展：

```typescript
const globalMdxComponents = {
  ...baseMdxComponents,

  // 添加新的自定义组件
  CustomAlert: (props: any) => (
    <div className="bg-blue-50 border border-blue-200 rounded p-4 my-4" {...props} />
  ),

  CustomButton: (props: any) => (
    <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" {...props} />
  ),
};
```

### 在 MDX 文件中使用

```mdx
# 标题

这是一个段落，使用默认的 markdown 样式。

\`\`\`javascript
// 代码块仍然有语法高亮
console.log('Hello, World!');
\`\`\`

<CustomAlert>
这是一个自定义警告组件
</CustomAlert>
```

## 结论

通过这次优化，MDX 渲染逻辑变得更加简洁和可维护，同时保持了必要的自定义功能。项目现在使用统一的 markdown 风格，符合你的需求目标。
