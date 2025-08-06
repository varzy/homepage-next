---
title: '刷新 macos dock 栏，可用于更新图标'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['MacOS']
date: '2020-11-29'
slug: 'macos-dock-refresh'
summary: ''
last_edited_time: '2025-08-06T03:18:00.000Z'
blog_last_fetched_time: '2025-08-06T06:18:28.946Z'
notion_id: '0b1815f0-2969-4d0b-97ec-a54a7be15acb'
icon: '🌈'
---

```json
rm /var/folders/*/*/*/com.apple.dock.iconcache; killall Dock
```
