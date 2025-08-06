---
title: '使用 Clash 时，Chrome 页面间歇性出现“连接已重置”问题解决方案'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: []
date: '2020-03-27'
slug: 'clash-chrome-connection-fail'
summary: ''
last_edited_time: '2025-08-06T03:20:00.000Z'
blog_last_fetched_time: '2025-08-06T06:20:45.264Z'
notion_id: 'ea8a4e83-d2b2-4078-955b-9b1ee921ac53'
icon: '🏸'
---

**原始链接：**

[https://github.com/Fndroid/clash_for_windows_pkg/wiki/Chrome%E4%B8%8B%E9%A1%B5%E9%9D%A2%E9%97%B4%E6%AD%87%E6%80%A7%E5%87%BA%E7%8E%B0%E2%80%9C%E8%BF%9E%E6%8E%A5%E5%B7%B2%E9%87%8D%E7%BD%AE%E2%80%9D%E9%97%AE%E9%A2%98%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88](https://github.com/Fndroid/clash_for_windows_pkg/wiki/Chrome%E4%B8%8B%E9%A1%B5%E9%9D%A2%E9%97%B4%E6%AD%87%E6%80%A7%E5%87%BA%E7%8E%B0%E2%80%9C%E8%BF%9E%E6%8E%A5%E5%B7%B2%E9%87%8D%E7%BD%AE%E2%80%9D%E9%97%AE%E9%A2%98%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88)

---

**Demo：**

```bash
---

port: 7890

socks-port: 7891

allow-lan: true

mode: Rule

log-level: silent

external-controller: 0.0.0.0:9090

secret: ''

dns:

enable: true

nameserver:

- '223.5.5.5' # 这里开始的DNS可以换成其他DNS，尽可能多设置几个，无需考虑污染

- '114.114.114.114'

- '1.1.1.1'
```
