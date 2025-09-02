---
title: '微信小程序构建简单的路由系统'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Miniprogram']
date: '2021-01-28'
slug: 'miniprogram-simple-router'
summary: ''
last_edited_time: '2025-09-02T07:54:00.000Z'
blog_last_fetched_time: '2025-09-02T09:29:40.565Z'
notion_id: '78d0d43e-be92-4e50-8b1b-2823d5c13d57'
icon: '🥈'
---

## 痛点 & 目标

在微信小程序中进行页面跳转时高度依赖文件路径，但当我们的目录层级过深，或者参数过多时，就会难以维护：

```javascript
wx.navigateTo(`/pages/mine/address/address?id=${this.data.id}&pageType=EDIT&jumpBack=Y`);
```

仔细分析，就会发现有以下几个痛点：

1. 路由路径和目录结构绑定，任何对目录结构的修改都需要对项目中全部路由路径进行修改
2. 参数可读性差，难以维护

而我们的目标是：

1. 解藕路由系统和目录结构，尽可能降低目录结构修改对路由产生的影响
2. 优化参数的传递方式，尽可能摆脱难以维护的字符串形式
3. 参数有迹可循，在不使用 Typescript 等工具时，尽可能让数据流清晰

## 路由系统实现

从 Vue Router 中汲取灵感，我们可以把所有的页面映射为一个对象，对象的 Key 类似 Vue Router 中的 name，路由跳转时只使用 key 值即可。当目录结构发生改变时只需要修改键值对中的 Value 即可，页面中的代码逻辑无需任何改动。新建 `config/routes.js`。

```javascript
export const Routes = {
  Index: '/pages/index/index',
  Mine: '/pages/mine/mine',
  About: '/pages/static/about/about',
  Register: '/pages/register/register',
	Address: '/pages/mine/address/address'
	...
};
```

新建 `utils/route.js`。

```javascript
import { Routes } from '../config/routes';

/**
 * 构建 url 参数
 * @param {string|object|null} params
 */
export const buildParams = (params) => {
  let fullParamStr;
  if (!params) {
    fullParamStr = '';
  } else if (typeof params === 'string') {
    fullParamStr = params;
  } else {
    fullParamStr = Object.keys(params)
      .map((key, index) => {
        const prefix = index === 0 ? `?` : `&`;
        return `${prefix}${key}=${params[key]}`;
      })
      .join('');
  }

  return fullParamStr;
};

/**
 * 高阶函数构建路由跳转模块
 * @param {Function} method
 */
const generateRoute = (method) => (routeName, params, events) => {
  const routePath = Routes[routeName];
  if (!routePath) {
    console.error(`The RouteName must be one of: ${Object.keys(Routes).join(', ')}`);
    return;
  }

  return new Promise((resolve, reject) => {
    const options = {
      url: routePath + buildParams(params),
      success: resolve,
      fail: reject,
    };
    if (events) options.events = events;

    method(options);
  });
};

export const switchTab = generateRoute(wx.switchTab);
export const reLaunch = generateRoute(wx.reLaunch);
export const navigateTo = generateRoute(wx.navigateTo);
export const redirectTo = generateRoute(wx.redirectTo);
export default { switchTab, reLaunch, navigateTo, redirectTo };
```

使用示例：

```javascript
import { navigateTo, reLaunch } from '../utils/route';

// 简单跳转
navigateTo('Register');

// 传入字符型作为参数
reLaunch('Index', `?withMessage=${this.data.message}`);

// 传入对象作为参数。同时支持 eventChannel 配置
navigateTo(
  'Address',
  { id: this.data.id, pageType: 'EDIT', jumpBack: 'Y' },
  // 需要在 Address 中触发 eventChannel.emit('edited')
  { edited: this.refreshAddress.bind(this) },
);
```

## 如何接收参数

为了让路由系统中的数据流向保持清晰，因此我们应当约定：**每个页面的参数都使用解构语法。**

```javascript
// ok
onLoad(options) {
}

// better
onLoad({ id, pageType = 'CREATE', jumpBack = 'Y' }) {
}
```
