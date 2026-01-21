---
title: '微信小程序中定制「加入群聊」插件的样式'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Miniprogram']
date: '2023-07-20'
slug: 'miniprogram-custom-customer-button-style'
summary: ''
last_edited_time: '2025-09-02T07:50:00.000Z'
blog_last_fetched_time: '2025-09-02T09:26:31.738Z'
page_id: 'c6499b75-9fc3-4f8a-a138-80a670d53b32'
icon: '🎊'
---

微信小程序中可以接入「加入群聊」插件，实现用户一键加入企业微信群的功能。相关文档：

- [「联系我」插件](https://developer.work.weixin.qq.com/document/path/93582)
- [在小程序中加入群聊](https://developer.work.weixin.qq.com/document/path/93884)

但这两个插件只提供了数个参数实现最基础的文字和图标的修改，开发者无法深度定制按钮样式。不过我们仍然可以通过一种非常 Hack 的方法实现样式定制，思路也非常简单：

**在按钮上方覆盖一层遮罩，并设置遮罩元素点击穿透。核心代码只有一行，即给遮罩添加：pointer-events: none;**

示例代码：

`index.wxml`：

```html
<view class="inviter">
  <view class="mask">
    <action-button>加入群聊</action-button>
  </view>
  <view class="trigger">
    <join-group-inviter url="{{ joinGroupUrl }}" />
  </view>
</view>
```

`index.wxss`：

```css
.inviter {
  position: relative;
}
.inviter .mask {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  z-index: 200;
  pointer-events: none;
}
.inviter .trigger {
  opacity: 0;
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 199;
}
```

最终效果如下：

![KpZBV9LNdYU5rJb.png](https://cdn.sa.net/2025/09/02/KpZBV9LNdYU5rJb.png)

不过需要注意的是：**覆盖元素的尺寸和形状都不能与「加入群聊」的差距过大，毕竟我们本质上还是在点击「加入群聊」按钮本身。**
