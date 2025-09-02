---
title: 'Get 和 Post 的区别'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['八股文']
date: '2020-05-12'
slug: 'different-of-get-and-post'
summary: ''
last_edited_time: '2025-09-02T07:11:00.000Z'
blog_last_fetched_time: '2025-09-02T07:54:29.772Z'
notion_id: '749806c1-0246-4fb0-99d3-a675318aa2e7'
icon: '📍'
---

- Get 请求的 URL 会被存放在历史记录中
- 各个浏览器支持的 URL 最大长度不一致，所以 Get 请求有长度限制
- GET 产生一个 TCP 数据包；POST 产生两个 TCP 数据包
  - Get 请求会把 header 和 data 一起发过去
  - POST 请求会先发送 header，服务器返回 100 之后再发 data
- GET 请求只能进行 url 编码，而 POST 支持多种编码方式
- GET请求是幂等性的，POST请求不是
