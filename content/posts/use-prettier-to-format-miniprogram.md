---
title: '使用 Prettier 格式化微信小程序代码'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Miniprogram', 'Prettier']
date: '2021-01-22'
slug: 'use-prettier-to-format-miniprogram'
summary: ''
last_edited_time: '2025-08-06T06:18:00.000Z'
blog_last_fetched_time: '2025-09-02T09:29:44.121Z'
notion_id: '5c815442-8abb-4500-8492-a6f8d4febe25'
icon: '🏆'
---

## 整理目录结构

将源码放到 `src` 目录下:

- `src`
  - `app.js`
  - `app.json`
  - `app.wxss`
  - `sitemap.json`
- `project.config.json`

接着修改 `project.config.json` 中的 `miniprogramRoot` 为 `src/`。

## **安装 Prettier**

首先我们需要创建一个 `package.json` 文件:

```bash
npm init -y
```

接着安装 Prettier。添加 `-D` 参数 (或者 `--save-dev`) 可以将其作为开发时依赖进行安装。

```bash
npm i -D prettier
```

在 `package.json` 中添加格式化命令:

```json
"scripts": {
  "lint": "prettier --write src/**/*.{wxml,wxss,js,json}"
},
```

## 配置 Prettier

在根目录下创建 `.prettierrc.js`。此处的配置可以根据需要自行替换，详见: [Options](https://prettier.io/docs/en/options.html)。其中最为核心的配置是 `parser` 这一项，我们需要将 wxml 按照 html 进行解析，wxss 按照 css 进行解析，而 wxs 按照 js 进行解析。需要注意的是，wxs 的限制比较大，比如对象的 key 必须写成字符类型，因此我们需要添加 `quoteProps: 'preserve'` 这个配置。

```javascript
module.exports = {
  singleQuote: true,
  printWidth: 100,
  trailingComma: 'none',
  arrowParens: 'avoid',
  overrides: [
    {
      files: '*.wxml',
      options: { parser: 'html' },
    },
    {
      files: '*.wxss',
      options: { parser: 'css' },
    },
    {
      files: '*.wxs',
      // wxs 中对象的 key 值必须带引号
      options: { parser: 'babel', quoteProps: 'preserve' },
    },
  ],
};
```

接着在根目录创建 `.prettierignore` 文件，这里面用来存放不需要进行格式化的文件。

```plain text
src/miniprogram_npm/
src/vendor/
```

至此，在终端中执行 `npm run lint` 就可以对小程序代码进行格式化了。Enjoy~
