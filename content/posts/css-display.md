---
title: 'CSS 中的 display；块级元素，内联元素'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['CSS', '八股文']
date: '2020-04-03'
slug: 'css-display'
summary: ''
last_edited_time: '2025-08-06T03:19:00.000Z'
blog_last_fetched_time: '2025-08-06T06:19:07.492Z'
notion_id: '6bc201dc-dec5-40d1-9049-6b260f33cfc5'
icon: '🏰'
---

## Display 的几个常用属性

- block
  - 形成 BFC
  - 元素表现为块级元素，前后有换行符
  - 宽高、margin，padding 都可以自行控制
- inline
  - 形成 IFC
  - 元素行为变为内联元素，前后没有换行符
  - 无法直接指定宽高，但可以设置 line-height 属性
  - margin 和 padding 只有左右生效，上下无效
  - 假如有高度不一致的元素，按照底端基准线进行排列
  - 可以使用 `vertical-align: middle` 属性使得内联元素内部垂直居中
- inline-block
  - 元素的排列行为表现为 inline，水平排列，前后有换行符
  - 元素的内容表现为 block，可自由设置宽高，margin 和 padding
  - 可以使用 `vertical-align: middle` 属性使得内联元素内部垂直居中
- flex
  - 形成 FFC 区域
  - 元素表现类似 block
- inline-flex
  - 形成 FFC
  - 元素表现类似 inline

[bookmark](https://developer.mozilla.org/zh-CN/docs/Web/CSS/display)

## 内联元素保护块级元素

如果内联元素容纳了块级元素，那么块级将渲染为块级，内联渲染为内联。

## 代码示例

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
    <style>
      .block {
        display: inline-block;
        width: 50px;
        height: 50px;
        background-color: #ccc;
        margin: 10px;
        /* vertical-align: middle; */
      }
      .block:nth-child(2) {
        height: 80px;
      }
    </style>
  </head>

  <body>
    <div class="show-inline_block">
      <div class="father">
        <span class="block"></span>
        <span class="block"></span>
        <span class="block"></span>
        <span class="block"></span>
        <span class="block"></span>
      </div>
    </div>

    <hr />

    <div class="show-block_in_inline">
      <span
        >123
        <p>456</p>
        789<span>101112</span></span
      >
    </div>
  </body>
</html>
```

![VqnrYMU3gIvRK4z.png](https://cdn.sa.net/2024/03/15/VqnrYMU3gIvRK4z.png)
