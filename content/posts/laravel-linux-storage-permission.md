---
title: 'Laravel 在 Linux 下存储目录无权限解决方案'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Laravel', 'PHP', 'Linux']
date: '2020-03-27'
slug: 'laravel-linux-storage-permission'
summary: ''
last_edited_time: '2026-08-18T14:55:00.000Z'
last_fetched_time: '2026-08-18T18:04:40.884Z'
page_id: '0779e43f-d639-4784-83dd-c49d09e95b5b'
icon: '🗝️'
---

```bash
sudo chown -R $USER:www-data storage
sudo chown -R $USER:www-data bootstrap/cache
chmod -R 775 storage
chmod -R 775 bootstrap/cache
```
