---
title: '在 JS 中对 WebSocket 进行简单封装'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['JavaScript']
date: '2021-04-13'
slug: 'js-websocket-basic-usage'
summary: ''
last_edited_time: '2025-08-06T06:17:00.000Z'
blog_last_fetched_time: '2025-09-02T09:29:04.896Z'
notion_id: '69768b3b-36e3-40ae-bee3-a497762b9b72'
icon: '👗'
---

RealtimeMonitor 类。支持：

- 心跳发送
- 链式定义 websocket 回调函数

```javascript
export default class RealtimeMonitor {
  heartId = 0;
  timer;
  ws;
  open;
  close;
  error;
  message;

  constructor(heartInterval = 3000) {
    this.heartInterval = heartInterval;
  }

  registerOpen(cb) {
    this.open = cb;
    return this;
  }

  registerClose(cb) {
    this.close = cb;
    return this;
  }

  registerError(cb) {
    this.error = cb;
    return this;
  }

  registerMessage(cb) {
    this.message = cb;
    return this;
  }

  connect() {
    this.ws = new WebSocket('ws://xxxx');

    this.ws.onopen = () => {
      this.ws.send('connected!');

      this.timer = setInterval(() => {
        this.ws.send(`hearting: ${this.heartId}`);
        this.heartId++;
      }, this.heartInterval);

      if (this.open) this.open();
    };

    this.ws.onmessage = (e) => {
      if (this.message) this.message(e);
    };

    this.ws.onclose = () => {
      this.timer && clearInterval(this.timer);

      if (this.close) this.close();
    };

    this.ws.onerror = () => {
      if (this.error) this.error();
    };
  }
}
```

使用：

```javascript
import RealtimeMonitor from '../../api/realtime-monitor';

this.monitoring = new RealtimeMonitor();
this.monitoring
  .registerOpen(() => {
    console.log('RealtimeMonitor connected.');
  })
  .registerClose(() => {
    console.log('RealtimeMonitor closed.');
  })
  .registerError(() => {
    this.$message.error('实时监控发生异常，请尝试重新刷新页面');
    console.error('RealtimeMonitor error.');
  })
  .registerMessage((e) => {
    // 业务逻辑
    console.log(e);
  })
  .connect();
```
