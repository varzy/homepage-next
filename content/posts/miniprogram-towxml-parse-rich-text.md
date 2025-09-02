---
title: '在小程序中使用 towxml 解析富文本'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Miniprogram']
date: '2021-08-15'
slug: 'miniprogram-towxml-parse-rich-text'
summary: ''
last_edited_time: '2025-09-02T07:22:00.000Z'
blog_last_fetched_time: '2025-09-02T07:53:49.847Z'
notion_id: 'c13ffbf0-e647-41f4-bc1f-a7952dd4bc4d'
icon: '🗼'
---

## towxml 是什么？

微信小程序内置了一个组件可以让我们渲染富文本，也就是 `<rich-text />` 组件。但该组件能力较弱，并且主要是为了渲染由小程序端输入的富文本内容，面对复杂的富文本时，`<rich-text />` 组件可能无法完全还原富文本内容。

为了解决这个问题，我们可以使用开源的 [sbfkcel/towxml](https://github.com/sbfkcel/towxml) 库。

> Towxml 是一个可将HTML、Markdown转为微信小程序WXML(WeiXin Markup Language)的渲染库。用于解决在微信小程序中Markdown、HTML不能直接渲染的问题。  
> —— towxml 的 Github README

## towxml 的构建

towxml 的使用非常简单，我们按照[官方文档](https://github.com/sbfkcel/towxml/wiki)一步步走就可以了。

首先，我们需要先克隆项目源码，并安装依赖：

```bash
# 克隆项目到本地
git clone https://github.com/sbfkcel/towxml.git

# 进入项目并安装依赖
cd towxml
npm install / yarn
```

接着我们编辑项目根目录中的 config.js，根据注释，仅保留自己需要的功能。这里给出一份我的配置：

```javascript
module.exports = {
    // LaTex公式、yuml解析服务架设参见 https://github.com/sbfkcel/markdown-server

    // 数学公式解析API
    latex:{
        api:'http://towxml.vvadd.com/?tex'
    },

    // yuml图解析APPI
    yuml:{
        api:'http://towxml.vvadd.com/?yuml'
    },

    // markdown解析配置，保留需要的选项即可
    markdown:[
        'sub',                      // 下标支持
        'sup',                      // 上标支持
        'ins',                      // 文本删除线支持
        'mark',                     // 文本高亮支持
        'emoji',                    // emoji表情支持
        // 'todo'                      // todo支持
    ],

    // 代码高亮配置，保留需要的选项即可（尽量越少越好，不要随意调整顺序。部分高亮有顺序依赖）
    highlight:[
     ...
    ],

    // wxml原生标签，该系列标签将不会被转换
    wxml:[
        'view',
        'video',
        'text',
        'image',
        'navigator',
        'swiper',
        'swiper-item',
        'block',
        'form',
        'input',
        'textarea',
        'button',
        'checkbox-group',
        'checkbox',
        'radio-group',
        'radio',
        'rich-text',

        // 可以解析的标签（html或markdown中会很少使用）
        // 'canvas',
        // 'map',
        // 'slider',
        // 'scroll-view',
        // 'movable-area',
        // 'movable-view',
        // 'progress',
        // 'label',
        // 'switch',
        // 'picker',
        // 'picker-view',
        // 'switch',
        // 'contact-button'
    ],

    // 自定义组件
    components:[
        'audio-player',             // 音频组件，建议保留，由于小程序原生audio存在诸多问题，towxml解决了原生音频播放器的相关问题
        // 'echarts',                  // echarts图表支持
        // 'latex',                    // 数学公式支持
        'table',                    // 表格支持
        'todogroup',                // todo支持
        // 'yuml',                     // yuml图表支持
        'img'                       // 图片解析组件
    ],

    // 保留原本的元素属性（建议不要变动）
    attrs:[
        'class',
        'data',
        'id',
        'style'
    ],

    // 事件绑定方式（catch或bind），catch 会阻止事件向上冒泡。更多请参考：https://developers.weixin.qq.com/miniprogram/dev/framework/view/wxml/event.html
    bindType:'catch',

    // 需要激活的事件
    events:[
        // 'touchstart',
        // 'touchmove',
        // 'touchcancel',
        // 'touchend',
        'tap',                      // 用于元素的点击事件
        'change',                   // 用于todoList的change事件
    ],

    // 图片倍数
    dpr:1,

    // 代码块显示行号
    showLineNumber:true
}
```

进行构建：

```bash
npm run build / yarn build
```

执行完毕后，项目根目录就会多出构建好的 `dist` 文件夹了。

## 在小程序中使用

我们把上一节中构建好的 `dist` 目录复制到需要使用的小程序项目的根目录中，并重命名为 `towxml`接下来我们就需要在项目中引入 towxml 包。

### 引入 towxml 组件

首先，我们需要在页面的 json 配置文件中引入 towxml 组件：

```json
{
  "usingComponents": {
    "towxml": "/towxml/towxml"
  }
}
```

### 在页面中插入组件

```html
<view class="container">
  <towxml nodes="{{article}}" />
</view>
```

### 引入并使用 towxml 解析方法

接下来我们需要引入 towxml 解析方法，这个方法负责解析富文本内容。

在 towxml 的官方文档 [如何使用](https://github.com/sbfkcel/towxml/wiki/3.0-%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8) 这一节中，demo 代码需要在 `app.js` 中全局注册 towxml 解析方法：

```javascript
// app.js
App({
	// 引入`towxml3.0`解析方法
	towxml:require('/towxml/index')
})

// page.js
const app = getApp();
onLoad() {
	app.towxml(...);
}
```

如果你的小程序中处处充斥着富文本解析的需求，那么这样做当然是更简便的。但大部分小程序中的富文本解析只占一小部分，因此我们可以考虑在某个页面中单独引入 towxml 解析方法。

```javascript
// page.js
import towxml from '../../vendor/towxml/index';
onLoad() {
	towxml(...);
}
```

至于方法的使用和具体 API，请参考 [官方文档中的 API](https://github.com/sbfkcel/towxml/wiki/3.0-%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8#api) 这一节。

```javascript
onLoad() {
  const result = app.towxml(`# Markdown`, "markdown", {
    base: "https://xxx.com", // 相对资源的base路径
    theme: "dark", // 主题，默认`light`
    events: {
      // 为元素绑定的事件方法
      tap: (e) => {
        console.log("tap", e);
      },
    },
  });

  // 更新解析数据
  this.setData({
    article: result,
    isLoading: false,
  });
}
```

### 注意取消 towxml 的格式化和代码检查

如果我们的小程序项目中使用了 Prettier 或者 ESLint，那么应当注意在 `.prettierignore` 和 `.eslintignore` 文件中添加对 towxml 目录的忽略。

## 更改 towxml 包在项目中的位置

在官方文档中，towxml 要求放置在小程序的根目录才能运行，如果我们放置到小程序的某个子目录中，比如 `/vendor/towxml`，即使项目中的引用路径正确也会抛出异常。

好在我们可以通过修改 `towxml/decode.json` 中的文件路径解决这个问题。假如我们把 towxml 文件夹放在 `/vendor/towxml` 目录下，那么我们可以把文件内容修改为：

```javascript
// towxml/decode.json
{
  "component": true,
  "usingComponents": {
    "decode": "/vendor/towxml/decode",
    "audio-player": "/vendor/towxml/audio-player/audio-player",
    "table": "/vendor/towxml/table/table",
    "todogroup": "/vendor/towxml/todogroup/todogroup",
    "img": "/vendor/towxml/img/img"
  }
}
```

重新编译小程序，就应该能够生效了。

## 在小程序分包中使用

towxml 虽然强大，但体积并不算小。笔者只打开了自己需要的功能，构建后的文件夹还是有 250KB。因此我们可以考虑把所有的富文本页面以及 towxml 拆成一个小程序分包。

### 新建分包

首先我们需要新建一个分包文件夹，比如 `/subpackages/richTextRender`。

接着我们需要在 `app.json` 中注册这个分包：

```javascript
{
	"subpackages": [
    {
      "root": "subpackages/rickTextRender",
      "pages": ["pages/articleDetail/articleDetail"]
    }
  ],
}
```

### 把 towxml 移入分包中

移动 towxml 文件夹到 `/subpackages/richTextRender/vendor/towxml`。

### 修改 decode.json

修改 `/subpackages/richTextRender/vendor/towxml/decode.json` 中的内容，保证文件路径和 towxml 所在的文件路径一致。

```javascript
{
  "component": true,
  "usingComponents": {
    "decode": "/subpackages/rickTextRender/vendor/towxml/decode",
    "audio-player": "/subpackages/rickTextRender/vendor/towxml/audio-player/audio-player",
    "table": "/subpackages/rickTextRender/vendor/towxml/table/table",
    "todogroup": "/subpackages/rickTextRender/vendor/towxml/todogroup/todogroup",
    "img": "/subpackages/rickTextRender/vendor/towxml/img/img"
  }
}
```

### 在页面中使用 towxml

page.js：

```javascript
// page.js
import towxml from '../../vendor/towxml/index';

onLoad() {
	const result = towxml(...);
	this.setData({ article: result })
}
```

page.json：

```javascript
// page.json
{
  "usingComponents": {
    "towxml": "/subpackages/rickTextRender/vendor/towxml/towxml"
  }
}
```

page.wxml：

```javascript
<view class="container">
  <towxml nodes="{{article}}" />
</view>
```
