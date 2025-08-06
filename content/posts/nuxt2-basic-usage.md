---
title: 'Nuxt2 技巧及开发手册'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Vue', 'Nuxt']
date: '2022-04-11'
slug: 'nuxt2-basic-usage'
summary: ''
last_edited_time: '2025-08-06T03:15:00.000Z'
blog_last_fetched_time: '2025-08-06T06:16:28.388Z'
notion_id: 'a51f70e4-8d64-456a-9266-fad7eb1841ce'
icon: '🎉'
---

## 框架调优

### 添加 src 目录

在根目录新建 src 目录，并将 `components`, `pages`, `static`, `store` 等目录移动至 src 中；在 `nuxt.config.js` 中添加配置项：

```javascript
export default {
  srcDir: 'src/',
};
```

如果项目中使用了 Jest 测试，那么我们还需要重新指定 Jest 中的根目录。修改 `jest.config.js`：

```javascript
module.exports = {
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // <rootDir>/$1 => <rootDir>/src/$1
    // '^~/(.*)$': '<rootDir>/$1',
    '^vue$': 'vue/dist/vue.common.js',
  },
};
```

### 添加 jsconfig.json

在项目根目录创建 `jsconfig.json`，使编辑器可以自动导入。为了和 Vue 官方保持一致，此处仅配置 `@` 符号，不再使用 `~`。

```javascript
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@@/*": ["./*"]
    }
  },
  "exclude": ["node_modules", ".nuxt", "dist"]
}
```

### 取消组件自动导入

Nuxt 默认会自动 `components` 目录下的全部组件，如此一来页面中便无需引入。但为了项目的可维护性以及方便编辑器的自动推导，我们应该关闭此功能。修改 `nuxt.config.js`：

```javascript
export default {
  // Auto import components: https://go.nuxtjs.dev/config-components
  components: false,
};
```

### 支持 Scss 和全局资源

```javascript
yarn add -D sass sass-loader@10 @nuxtjs/style-resources
```

在 nuxt.config.js 中添加配置：

```javascript
buildModules: [
    // https://go.nuxtjs.dev/eslint
    '@nuxtjs/eslint-module',
    // https://go.nuxtjs.dev/stylelint
    '@nuxtjs/stylelint-module',
    '@nuxtjs/style-resources'
],

styleResources: {
    scss: ['@/assets/css/resources.scss'],
},
```

这样一来，`resources.scss` 的资源将被全局加载。

## 项目规范

### 命名统一

- 文件夹全部使用 kebab-case
- 页面以外的 Vue 组件全部使用 PascalCase

### 静态资源

需要被打包的全局资源放在 `src/assets` 目录下，无需打包的放置在 `src/static` 目录下。应当尽可能保证资源尽可能走打包流程。

### 全局样式组织

遵循唯一入口原则。在 `nuxt.config.js` 中引入唯一的全局样式入口文件：

```javascript
export default {
  // Global CSS: https://go.nuxtjs.dev/config-css
  css: ['@/assets/css/main.scss'],
};
```

在 `main.scss` 严格遵守样式加载的先后顺序，尽可能避免样式干扰。

![6GW5do9gzPqUhlI.png](https://cdn.sa.net/2024/03/15/6GW5do9gzPqUhlI.png)

### asyncData 和 fetch

Nuxt 中最重要的两个生命周期之一，我们需要严格区分 asyncData 和 fetch 的使用场景。

🆚对比

- asyncData：在页面渲染前调用，且只能在服务端调用；无法访问 this；页面跳转后必定触发；可以借助 `validate()` 生命周期进行数据校验
- fetch：服务端、客户端均可调用；可以直接访问 this；提供了 `$fetchState` 等更多 API，可以实现 loading、error 等更多效果

🔑推荐使用场景

- asyncData
  - 加载任何情况下都在服务端就拼装好的数据
  - 需要进行数据校验，加载失败便无法进入的页面
- fetch
  - 需要双端获取的数据
  - 加载缓慢的数据，可以借助 `$fetchState.pengding` 实现 loading 占位
  - 对页面影响不大，即使加载失败也无妨的数据，比如：页面主要区域以外的侧边栏等，可以借助 `$fetchState.error` 实现 error 占位

⚠️特别注意

- **如果需要在生命周期中同时发起多个请求，务必使用 Promise.all (或 Promise.allSettled) 进行并发**
- 当使用 `<nuxt-link />` 进行页面跳转时，已经加载过的页面将具备单页行为，**此时目标页面的** **`fetch`** **仍将在** **`mouted`** **之前执行，但不会等待异步操作执行完毕。**因此假如目标页面在 `mounted` 中尝试获取依赖 `fetch` 结果才能渲染的 dom 时，必定会找不到 dom 节点。解决方案：

  - 使用 a 标签替代 `<nuxt-link />`。不推荐。这会使目标页面完全重载，失去单页效果
  - 使用 asyncData 填充数据
  - 结合 `$fetchState.pending` 实现 loading 效果，并将 `mounted` 中的逻辑移至 `watch` API 中：

    ```javascript
    watch: {
      $fetchState: {
        deep: true,
        immediate: true,
        handler(val) {
          if (!val.pending && !val.error) {
            console.log(document.querySelector('#target'));
          }
        }
      }
    }
    ```
