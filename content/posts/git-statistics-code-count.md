---
title: '通过 Git 一键统计代码量'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Git']
date: '2020-03-27'
slug: 'git-statistics-code-count'
summary: ''
last_edited_time: '2025-08-06T06:20:00.000Z'
blog_last_fetched_time: '2025-09-02T09:32:42.495Z'
page_id: '17848162-2358-4506-925f-15b95de05e42'
icon: '📋'
---

```bash
git log --format='%aN' | sort -u | while read name; do echo -en "$name\\t"; git log --author="$name" --pretty=tformat: --numstat | awk '{ add += $1; subs += $2; loc += $1 - $2 } END { printf "added lines: %s, removed lines: %s, total lines: %s\\n", add, subs, loc }' -; done
```
