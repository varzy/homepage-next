---
title: '删除 MacOS LaunchPad 中的顽固图标'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['MacOS']
date: '2021-04-10'
slug: 'remove-macos-launchpad-icons'
summary: ''
last_edited_time: '2025-08-06T06:17:00.000Z'
blog_last_fetched_time: '2025-09-02T09:29:08.163Z'
page_id: '0fb66447-03f9-4631-a46a-76ae28912a72'
icon: '🛁'
---

```bash
# 进入启动台数据库所在的文件夹。使用这个命令有可能会在控制台输出某些目录没有权限，无视即可
cd /private/var/folders/**/com.apple.dock.launchpad/db

# 执行删除并重启 Dock。这里需要把 GarageBand 换成需要删除的软件名称
sqlite3 db "delete from apps where title='GarageBand';" && killall Dock
```
