---
title: '使用 Stylelint 规范样式代码'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['CSS']
date: '2021-10-05'
slug: 'stylelint-basic-usage'
summary: ''
last_edited_time: '2025-09-02T08:00:00.000Z'
last_fetched_time: '2025-09-02T09:28:38.232Z'
page_id: 'daf51441-5527-4fca-b73b-cb1615d57093'
icon: '🎣'
---

Stylelint 是一个强大和现代的 CSS 审查工具，有助于开发者推行统一的代码规范，避免样式错误，目前已经原生支持 CSS、Less、Sass 等语法。Stylelint 的 API 与 ESLint 高度一致，如果你使用过 ESLint，那么应该很容易就可以上手 Stylelint。

## 起步

和 ESLint 高度类似，Stylelint 也支持了配置、插件等各种功能。因此我们首先需要安装 `stylelint` 本体和基础的 standard 规则集。

```shell
npm install -D stylelint stylelint-config-standard
// or
yarn add -D stylelint stylelint-config-standard
```

接着我们在项目根目录创建一个 Stylelint 的配置文件。官网示例要求你新建一个 `.stylelintrc.json` 文件，但实际上你也可以使用 `.stylelintrc.js` 等文件格式。我个人更喜欢使用 js 格式的配置文件。

在项目根目录新建 `.stylelintrc.js` 文件，添加以下规则：

```javascript
module.exports = {
  extends: ['stylelint-config-standard'],
};
```

接着我们可以在 `package.json` 中添加 npm 脚本实现一键格式化并检查样式文件：

```javascript
"scripts": {
  "stylelint": "stylelint --fix \"src/**/*.{css,sass,scss}\"",
},
```

当然，你的项目可能不止有 Stylelint 这一种格式化工具，因此我更推荐你添加一条统一的“串联”命令：

```javascript
"scripts": {
  "lint:prettier": "prettier --loglevel warn --write \"src/**/*.{wxml,wxss,scss,wxs,json,md}\"",
  "lint:eslint": "eslint --fix \"src/**/*.js\"",
  "lint:stylelint": "stylelint --fix \"src/**/*.scss\"",
  // 执行 npm run lint 可以一次性格式化多种文件
  "lint": "npm run lint:prettier && npm run lint:eslint && npm run lint:stylelint",
},
```

## CSS 属性自动排序

早在多年以前，我就读过关于 CSS 属性排序的最佳实践，比如文档流相关属性靠上放，而元素自身属性往后放等。但即使是像我这样的超级重度代码格式化强迫症都无法完全遵循之。毕竟 CSS 代码是非正交的，属性的上下排列影响实在微乎其微。我连样式都懒得写了，你竟然还让我手动加一些没什么意义的排序？而 Stylelint 就可以帮我们无痛搞定这件事。

首先我们安装 `stylelint-order` 这个插件：

```javascript
yarn add -D stylelint-order
```

接下来我们需要在 Stylelint 的配置文件中启用这个插件：

```javascript
// .stylelintrc.js
module.exports = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-order'],
};
```

接下来你就可以自定义各种属性排序规则了，详情请查阅插件的 [Github README](https://github.com/hudochenkov/stylelint-order)。比如：

```javascript
// .stylelintrc.js
module.exports = {
  extends: ['stylelint-config-standard'],
  plugins: ['stylelint-order'],
  rules: {
    'order/order': ['custom-properties', 'declarations'],
    'order/properties-order': ['width', 'height'],
  },
};
```

但我仍然更推荐你直接使用其他开发者维护的规则集合。在 [Example configs](https://github.com/hudochenkov/stylelint-order#example-configs) 这一节中提到了几个官方推荐的规则集，分别是：

- [`stylelint-config-idiomatic-order`](https://github.com/ream88/stylelint-config-idiomatic-order)
- [`stylelint-config-hudochenkov/order`](https://github.com/hudochenkov/stylelint-config-hudochenkov/blob/master/order.js)
- [`stylelint-config-recess-order`](https://github.com/stormwarning/stylelint-config-recess-order)
- [`stylelint-config-property-sort-order-smacss`](https://github.com/cahamilton/stylelint-config-property-sort-order-smacss)

经过我的实际使用体验，我个人认为 [`stylelint-config-recess-order`](https://github.com/stormwarning/stylelint-config-recess-order) 是其中最好的一个。因此我们可以安装并使用这个规则集：

```shell
yarn add -D
stylelint-config-recess-order
```

```javascript
// .stylelintrc.js
module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-recess-order'],
  plugins: ['stylelint-order'],
};
```

## 自定义规则

当某些默认规则不符合你的胃口时，你也可以重新编写规则进行覆盖。在 Stylelint 的 [Rules](https://stylelint.io/user-guide/rules/list/) 这一小节中，你可以找到 Stylelint 支持的所有规则。

> 💡 就个人感受而言，Stylelint 的各种规则仍略显保守，比如很多选项只能进行修改而无法进行关闭，而 ESLint 就给人一种无所不能的感觉。

下面给出一个完整的配置文件例子：

```javascript
module.exports = {
  extends: ['stylelint-config-standard', 'stylelint-config-recess-order'],
  plugins: ['stylelint-order'],
  rules: {
    // 兼容微信小程序的自定义组件
    'selector-type-no-unknown': [true, { ignoreTypes: ['page', 'scroll-view', 'block'] }],
    // 兼容 rpx 单位
    'unit-no-unknown': [true, { ignoreUnits: ['rpx'] }],
    // 兼容部分 Sass 语法
    'at-rule-no-unknown': [
      true,
      { ignoreAtRules: ['function', 'if', 'else', 'for', 'each', 'include', 'mixin', 'return'] },
    ],
  },
};
```

## 忽略部分文件

你可以创建类似 `.gitignore` `.prettierignore` 和 `.eslintignore` 这样的 `.stylelintignore` 文件用于忽略你不需要进行检查的样式文件。

```plain text
src/miniprogram_npm/
src/vendor/
```
