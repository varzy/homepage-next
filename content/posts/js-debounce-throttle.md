---
title: '节流，防抖'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['JavaScript']
date: '2020-05-11'
slug: 'js-debounce-throttle'
summary: ''
last_edited_time: '2025-09-02T07:54:00.000Z'
blog_last_fetched_time: '2025-09-02T09:29:58.442Z'
notion_id: '2e170469-d4be-446e-bfc2-5c462e74c33b'
icon: '❄️'
---

## 防抖(debounce)

在事件被触发 n 秒后再执行回调，如果在这 n 秒内又被触发，则重新计时。

常用：搜索联想时发送 Ajax 请求

```javascript
function debounce(fn) {
  // 创建一个标记用来存放定时器的返回值
  let timeout = null;
  return function () {
    // 每当用户输入的时候把前一个 setTimeout clear 掉
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      // 然后又创建一个新的 setTimeout, 这样就能保证输入字符后的 interval 间隔内如果还有字符输入的话，就不会执行 fn 函数
      fn.apply(this, arguments);
    }, 500);
  };
}
```

## 防抖(throttle)

在一个单位时间内只能触发一次函数。如果这个单位时间内触发多次函数，只有一次生效。

常用：窗口 resize，滚动事件

```javascript
function throttle(fn) {
  let canRun = true; // 通过闭包保存一个标记
  return function () {
    if (!canRun) return; // 在函数开头判断标记是否为true，不为true则return
    canRun = false; // 立即设置为false
    setTimeout(() => {
      // 将外部传入的函数的执行放在setTimeout中
      fn.apply(this, arguments);
      // 最后在setTimeout执行完毕后再把标记设置为true(关键)表示可以执行下一次循环了。当定时器没有执行的时候标记永远是false，在开头被return掉
      canRun = true;
    }, 500);
  };
}
```
