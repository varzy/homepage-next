---
title: 'JS 多次点击后触发，可用来制作彩蛋'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['JavaScript']
date: '2020-09-17'
slug: 'js-mutliple-click'
summary: ''
last_edited_time: '2025-09-02T07:12:00.000Z'
blog_last_fetched_time: '2025-09-02T07:54:27.888Z'
notion_id: '49e37246-de0d-4cc4-b8b9-dc075f71b0a8'
icon: '🧨'
---

```javascript
/**
 * 多次点击然后触发回调
 */
export function multipleClicksAndThen(fn, times = 8, duration = 2000) {
  let timeStamps = [];
  return function () {
    let timeStamp = arguments[arguments.length - 1].timeStamp;
    timeStamps.push(timeStamp);
    if (timeStamps.length === times) {
      if (timeStamps[times - 1] - timeStamps[0] < duration) {
        fn.apply(this, arguments);
      }
      timeStamps = [];
    }
  };
}
```
