---
title: 'CSS 的两种盒模型'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['CSS']
date: '2020-04-03'
slug: 'css-boxing'
summary: ''
last_edited_time: '2025-08-06T03:19:00.000Z'
blog_last_fetched_time: '2025-08-06T06:19:15.826Z'
notion_id: '21f9771d-77d7-4c28-858c-3aab9b489f68'
icon: '🚑'
---

CSS 有两种盒模型，目前大部分使用 IE 盒模型

- IE 盒模型：width = content + padding + border
- W3C 盒模型：width = content

切换盒模型的方式：

```scss
// W3C
box-sizing: content-box;
// IE
box-sizing: border-box;
```
