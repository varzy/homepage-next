---
title: 'CSS 实现图片占位'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['CSS']
date: '2020-03-27'
slug: 'css-placeholder'
summary: ''
last_edited_time: '2025-08-06T06:20:00.000Z'
blog_last_fetched_time: '2025-09-02T09:32:25.633Z'
page_id: '06a2bebd-59b6-4181-b30b-ca4528261c32'
icon: '🥊'
---

图片占位是指在图片还没有加载完毕时，页面中预设好图片的宽高，以免图片加载完毕后重新布局导致页面闪烁。

div 中的 `padding-bottom` 值就是预设的图片高度，可以是一个具体的数值，亦可以是一个百分比。一般情况下，应当使得 `width` / `padding-bottom` = 需要加载图片的宽高比。因此如果将 `padding-bottom` 设置为 `100%`，那么图片区域将会是一个正方形。

```html
<div class="div"><img src="" />\\</div>
```

```css
.div {
  width: 100%;
  height: 0;
  padding-bottom: 100%;
  position: relative;
}

.div img {
  width: 100%;
  height: 100%;
  position: absolute;
}
```
