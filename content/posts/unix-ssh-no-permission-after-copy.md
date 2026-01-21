---
title: '解决 Unix 系统复制 .ssh 文件夹后提示权限过于开放的问题'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Linux']
date: '2020-03-27'
slug: 'unix-ssh-no-permission-after-copy'
summary: ''
last_edited_time: '2025-08-06T06:20:00.000Z'
blog_last_fetched_time: '2025-09-02T09:32:51.643Z'
page_id: '3c9d627e-6af9-4a26-bd31-26bd5d60bd32'
icon: '♟️'
---

```bash
chmod 400 ~/.ssh/id_rsa
chmod 400 ~/.ssh/id_rsa.pub
```
