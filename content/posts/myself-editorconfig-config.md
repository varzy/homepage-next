---
title: '.editorconfig 自用配置'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Git']
date: '2020-03-27'
slug: 'myself-editorconfig-config'
summary: ''
last_edited_time: '2025-08-06T06:20:00.000Z'
blog_last_fetched_time: '2025-09-02T09:32:43.792Z'
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
