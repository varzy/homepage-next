---
title: '.editorconfig 自用配置'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['工程化']
date: '2020-03-27'
slug: 'editorconfig-config'
summary: ''
last_edited_time: '2026-08-14T17:02:00.000Z'
last_fetched_time: '2026-08-14T17:08:19.129Z'
page_id: 'b13f1dd7-a207-43c7-b6c2-bee6c469fe43'
icon: '🚡'
---

```bash
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
tab_width = 2
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[*.{yml,yaml}]
indent_size = 2

[*.{php,py}]
indent_size = 4
tab_width = 4

[*.blade.php]
indent_size = 2
tab_width = 2
```
