---
title: '更改 Chrome 进度条样式'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['CSS', 'Browser']
date: '2020-06-11'
slug: 'chrome-scrollbar-style-custom'
summary: ''
last_edited_time: '2025-08-06T03:18:00.000Z'
blog_last_fetched_time: '2025-08-06T06:18:33.435Z'
notion_id: '5c19a41b-b70c-40f5-aeef-6c250ea597d5'
icon: '👠'
---

```css
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-corner {
  background-color: #fff;
}
::-webkit-scrollbar-thumb {
  background-color: #cbcbcb;
  border: solid 2px #cbcbcb;
  border-radius: 4px;
}
::-webkit-scrollbar-track-piece {
  background-color: #fff;
  -webkit-border-radius: 4px;
}
```
