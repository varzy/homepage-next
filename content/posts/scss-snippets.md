---
title: 'Scss Snippets'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['CSS']
date: '2020-03-27'
slug: 'scss-snippets'
summary: ''
last_edited_time: '2025-09-02T08:39:00.000Z'
blog_last_fetched_time: '2025-09-02T08:57:04.458Z'
notion_id: '9ded96a8-4903-48d2-b715-91db1082e034'
icon: '💊'
---

## text align

```scss
@each $position in left, center, right {
  .align-#{$position} {
    text-align: $position;
  }
}
```

## flex

```scss
.flex {
  display: flex;

  &-top {
    align-items: flex-start;
  }

  &-middle {
    align-items: center;
  }

  &-bottom {
    align-items: flex-end;
  }

  &-stretch {
    align-items: stretch;
  }

  &-baseline {
    align-items: baseline;
  }

  &-left {
    justify-content: flex-start;
  }

  &-center {
    justify-content: center;
  }

  &-right {
    justify-content: flex-end;
  }

  &-between {
    justify-content: space-between;
  }

  &-around {
    justify-content: space-around;
  }
}
```

## scss mixin 设置省略号

```scss
@mixin set-ellipsis($line: 1) {
  word-break: break-all;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: $line;
  overflow: hidden;
}
```

## scss mixin 设置斑马纹

```scss
@mixin set-striped($odd, $even) {
  &:nth-child(odd) {
    background-color: $odd !important;
  }

  &:nth-child(even) {
    background-color: $even !important;
  }
}
```
