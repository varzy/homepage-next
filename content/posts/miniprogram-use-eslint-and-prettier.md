---
title: '在微信小程序项目中引入 ESLint 和 Prettier'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Miniprogram', 'ESLint', 'Prettier']
date: '2021-03-18'
slug: 'miniprogram-use-eslint-and-prettier'
summary: ''
last_edited_time: '2025-09-02T07:53:00.000Z'
blog_last_fetched_time: '2025-09-02T09:29:23.190Z'
page_id: 'd8b8d8e8-1895-4173-9008-058ed75b6cd5'
icon: '⛳'
---

在之前的项目中，我引入了 Prettier 用于格式化微信小程序的项目代码。但随着项目越来越大，靠人脑去检查代码变得越来越复杂，我开始怀念使用 Vue Cli 编写代码时 ESLint 提供的强大代码检查能力。于是在上一篇引入 Prettier 的基础上，我又尝试引入了 ESLint。目前来看坑其实并不多，最终的效果也比较令人满意。但随着项目越来越大，靠人脑去检查代码变得越来越复杂，我开始怀念使用 Vue Cli 编写代码时 ESLint 提供的强大代码检查能力。于是在上一篇引入 Prettier 的基础上，我又尝试引入了 ESLint。目前来看坑其实并不多，最终的效果也比较令人满意。

## 目标 & 结果

- ✅ 执行一条 npm 脚本，自动使用 Prettier 格式化代码，并用 ESLint 检查 js 语法。检查结果能够在终端中输出
- ✅ 在 VSCode 中自动显示 ESLint 检查结果。前提是需要安装 ESLint 插件
- ~~❌ 在微信开发者工具中自动显示 ESLint 检查结果。~~~~_失败原因：微信开发者工具中虽然支持添加自定义的 VSCode 插件，但把 ESLint 插件复制到微信开发者工具的自定义插件目录后并不能生效_~~
- (更新于2021.07.01) ✅ 在微信开发者工具中自动显示 ESLint 检查结果。微信开发者工具自 `Stable 1.05.2106250` 版本开始支持安装部分 VSCode 插件，因此在开发者工具中安装 ESLint 插件后即可正常开启检查

## 原理

- 不再使用 Prettier 直接格式化 js 文件，而是通过 ESLint + Prettier 插件实现对 js 文件的自动格式化。当然，Prettier 还要负责继续格式化 js 以外的文件
- 使用 ESLint 检查 js 文件，并且由于小程序支持高级语法的自动编译，因此我们需要结合 Babel 去解析高级的 js 语法

## 实现

### 引入 Prettier

具体可以查看前文 [使用 Prettier 格式化微信小程序代码](https://varzy.me/posts/use-prettier-to-format-miniprogram)，此处不再赘述。当然，如果你不想使用 Prettier，完全可以只修改目录结构，保证和下面的步骤兼容即可。

### 引入 ESLint

首先，我们安装 ESLint 相关依赖：

```bash
yarn add -D eslint eslint-config-prettier eslint-plugin-prettier
```

相关文档：

- [Configuring ESLint](https://eslint.org/docs/user-guide/configuring/)
- [eslint-plugin-prettier](https://github.com/prettier/eslint-plugin-prettier)

接着，在根目录下添加 `.eslintrc.js`：

```javascript
module.exports = {
  env: {
    browser: true,
    node: true,
    es6: true,
    commonjs: true,
  },
  extends: ['eslint:recommended', 'plugin:prettier/recommended'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaVersion: 6,
    sourceType: 'module',
  },
  globals: {
    App: true,
    Page: true,
    Component: true,
    Behavior: true,
    wx: true,
    getApp: true,
    getCurrentPages: true,
  },
  rules: {
    // 未使用的变量也不会对小程序有很大影响，因此设为 warn
    'no-unused-vars': 'warn',
    // prettier 的异常大多是代码格式问题，设为 warn 就可以了
    'prettier/prettier': 'warn',
  },
};
```

注意：上面的 ESLint 配置中有这么一条：`parser: '@babel/eslint-parser'`。parser 就是 ESLint 的解析器，由于小程序里使用了 ES6+ 的语法，因此我们还需要引入 Babel。

### 引入 Babel

首先安装 Babel 和 ESLint 使用的解析器：

```bash
yarn add -D @babel/core @babel/eslint-parser
```

注意：我们这里安装的是 [@babel/eslint-parser](https://github.com/babel/babel/tree/main/eslint/babel-eslint-parser) 而非网上很多老教程里的 [babel-eslint](https://github.com/babel/babel-eslint)。如果你点进 babel-eslint 的仓库就会发现这个依赖已经被归档了，现在更推荐使用前者。

接下来，我们还需要添加 babel 的配置。由于我们仅需要满足最基本的解析需求，所以配置文件应该怎么简单怎么来，因此我们直接选用 `@babel/pretset-env`。安装：

```javascript
yarn add -D @babel/preset-env
```

接下来，我们在根目录添加配置文件 `babel.config.js`，具体可以查看[文档](https://babeljs.io/docs/en/configuration)。在 `babel.config.js` 中写入：

```javascript
module.exports = {
  presets: ['@babel/preset-env'],
};
```

All Done！理论上现在所有的配置都已经完成了！不过，我们还可以把 Babel 的 targets 设置为微信开发者工具编译时的相同配置，这样就可以保证 Babel 解析器进一步贴近生产环境。

```javascript
module.exports = {
  // <https://developers.weixin.qq.com/miniprogram/dev/devtools/codecompile.html>
  targets: {
    chrome: '53',
    ios: '8',
  },
  presets: ['@babel/preset-env'],
};
```

### 添加 Node Script

为了实现一键操作，我们可以编写一个 Node Script。打开 `package.json`，在 `scripts` 里添加：

```json
"lint:prettier": "prettier --loglevel warn --write \"src/**/*.{wxml,wxss,wxs,json,md}\"",
"lint:eslint": "eslint --fix \"src/**/*.js\"",
"lint": "npm run lint:prettier && npm run lint:eslint",
```

`lint:prettier` 中的 `--loglevel warn` 可以保证终端中不显示格式化过程。如果不想在终端中看到一大坨的文件列表，就可以添加这个配置。更多参数可以查看 [官方文档](https://prettier.io/docs/en/cli.html#--loglevel)。

现在，我们在终端中敲入 `npm run lint` 就可以同时实现格式化代码和语法检查了。

### 具体问题具体分析

当我们执行 `npm run lint` 后，没有报错并不代表我们的语法是全部安全的，有报错也不代表我们的语法是不可执行的。毕竟真正编译 js 的是微信开发者工具，整个编译过程是一个黑盒。而我们只使用了 Babel 的解析能力，Babel 解析后给出的报错信息只能作为参考。作为开发者，我们能消除就消除，消除不了就看真实环境是否有问题，如果没有问题忽略即可。

举个例子，我的某个项目中有编写了很多使用 Class 语法的类，而 Class 类里面的静态成员都会报错：

```javascript
23:22  error  Parsing error: /Users/zy/Developer/Sohu/pickpick-wxmp/src/utils/Auth.js: Support for the experimental syntax 'classProperties' isn't currently enabled (23:23):

  21 |  */
  22 | export class Auth {
> 23 |   static keyIsWxLogin = 'user:is_wx_login';
     |                       ^
  24 |   static keyIsLogged = 'user:is_logged';

Add @babel/plugin-proposal-class-properties (https://git.io/vb4SL) to the 'plugins' section of your Babel config to enable transformation.
If you want to leave it as-is, add @babel/plugin-syntax-class-properties (https://git.io/vb4yQ) to the 'plugins' section to enable parsing
```

但事实上这种静态变量语法是能够在小程序中正常使用的，只需要忽略这些异常即可。或者我们还可以通过给 Babel 添加 `@babel/plugin-proposal-class-properties` 插件解决这些报错。
