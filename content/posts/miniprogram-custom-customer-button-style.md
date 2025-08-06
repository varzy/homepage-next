---
title: '微信小程序中定制「加入群聊」插件的样式'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Miniprogram']
date: '2023-07-20'
slug: 'miniprogram-custom-customer-button-style'
summary: ''
last_edited_time: '2025-08-06T03:14:00.000Z'
blog_last_fetched_time: '2025-08-06T06:15:05.732Z'
notion_id: 'c6499b75-9fc3-4f8a-a138-80a670d53b32'
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

![JbwgB5lAioUVy72.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/e753f4ed-a9d5-4b94-80b5-b5d3a8dd4851/06693800-b753-4bf3-85a3-f79738f4255a/JbwgB5lAioUVy72.png?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIAZI2LB4663WF44XJX%2F20250806%2Fus-west-2%2Fs3%2Faws4_request&X-Amz-Date=20250806T061505Z&X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEDUaCXVzLXdlc3QtMiJHMEUCIGA2aU9noiAW2HDd1Fs9ZHDHhUAcEKrf7tjganQXKcGAAiEAhLY5X4AgsGAqgTuyuaCJDy8j92KnhKNJP5WD2v0hKuEq%2FwMIbhAAGgw2Mzc0MjMxODM4MDUiDJlJUNnuHsDTL8xPuyrcA7HUuJsFgM0bAQy%2FZIDglJKZaIG6xkT4SmZoPg0cTa7U%2ByIm5xlbbczMtMQK1HtjiPXUptL%2BxmOoKb43VRzCv2Nb8IrvAHKG%2FNU6%2FdpC0ZwddUVChbT3cMKvN%2F01duyVjMeH6CTYegjUx1HGonNZzDfHxgwiDTDFd0pbPWUgA12%2FDzfA%2BULF5%2Bl1kANgJqyHK5Ic8lKLxtLJ0ighX2STpOXNInT45Tl5TWN%2FI3m1tPcuA1e1Fl98xGOwxv4I9Sg7Ee5fuL1NK8wdsI%2F9fB5f9ODdaMQjtF8r8i4KdeadXS6eiRRVYFBLczioC0ZvXeamTlhVOufclzL1YB8oEAnqpPxG8u2PRSpfIH5mk4qParme7CCikoAbISii%2FCNiuQA201RfNAxPrHRtS7Hh9sSUn%2Fs6H19em4WdOtt9VATZ2TrRJU6DBByVUvUBdTUjZvdla7u2AUN2Hm97xmX%2BvHlF%2BXCOTlW58ar0ISkcS4AwYbHSFJl68WX07lIrz%2B5IaunTQ2V54OgeLDfJOqnr65TpagMo0z%2BMkhEQKFAuvHzwFQCQbDNsFX7Yx9jqZsjRifP5WZKw07S45NeWf5wV0zok%2BWxk6sm52vE%2Fyn7l%2BQYPZQ8Ksk1fq8pOwehODQkmMNjKy8QGOqUBHEk36Hf0YuW5Co5yd3YEdwq5YTE%2FhNEPVcRVBt3%2Fff2GTP7EUEGb3BeZiO8xaJ84JWfSPhGdOSgAcfIQrr1zXweNsP6lqQNpzZvPdlk6ns5QY6pYniYpkBoF7Zn7KmUgJ21ZcA075Ghu3WUqsovFuzd%2FEhFklXVDH7ns29Lr8x9zs1n1NXRCRJlpL0Trfyhms0Ud7uGLXU%2ByirsL66m%2B8Ag0SCdf&X-Amz-Signature=9bf759c3447c91dad4d81f47af5e55aff24ec72fd5bd9cd8a0f239e551a44622&X-Amz-SignedHeaders=host&x-amz-checksum-mode=ENABLED&x-id=GetObject)

不过需要注意的是：**覆盖元素的尺寸和形状都不能与「加入群聊」的差距过大，毕竟我们本质上还是在点击「加入群聊」按钮本身。**
