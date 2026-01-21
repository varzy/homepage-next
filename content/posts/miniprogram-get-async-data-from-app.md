---
title: '微信小程序页面中获取 app.js 中的异步数据'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Miniprogram']
date: '2021-01-29'
slug: 'miniprogram-get-async-data-from-app'
summary: ''
last_edited_time: '2025-08-06T06:18:00.000Z'
blog_last_fetched_time: '2025-09-02T09:29:37.967Z'
page_id: 'df1bc672-2b17-4a7d-9101-0c97dbef01c9'
icon: '🎭'
---

微信小程序的 app.js 和刚进入时首次展示的 page.js 将同步执行，因此有些时候在 page.js 中需要获取 app.js 中异步数据时，就需要一些奇淫巧技。在微信小程序的初始 Demo 中展示了页面中获取 app.js 中用户信息的逻辑，本质是在 app 实例中添加了一个回调：

```javascript
// app.js
// 获取用户信息
wx.getSetting({
  success: (res) => {
    if (res.authSetting['scope.userInfo']) {
      wx.getUserInfo({
        success: (res) => {
          this.globalData.userInfo = res.userInfo;

          if (this.userInfoReadyCallback) {
            this.userInfoReadyCallback(res);
          }
        },
      });
    }
  },
});

// pages/index/index.js
if (app.globalData.userInfo) {
  this.setData({
    userInfo: app.globalData.userInfo,
    hasUserInfo: true,
  });
} else {
  app.userInfoReadyCallback = (res) => {
    this.setData({
      userInfo: res.userInfo,
      hasUserInfo: true,
    });
  };
}
```

但当有很多页面都需要获取 app.js 中的用户信息时，就需要每个页面给 app 实例添加回调函数，这样无疑会增加很多冗余代码，以及额外的维护成本。因此我们可以进行简单的封装，给 app.js 添加一个统一的回调或异步函数，每个页面都只需要调用这一个方法即可。

```javascript
App({
  globalData: {
    // ===== User Info =====
    isUserInfoInited: false,
    userInfoListeners: [],
    isRegistered: false,
    userInfo: null,
  },

  onLaunch() {
    this.initUserInfo();
  },

  async initUserInfo() {
    // 自行实现获取用户信息的方法，可异步可同步
    const userInfo = await Auth.login();

    this.globalData.userInfo = userInfo.userInfo;
    this.globalData.isRegistered = userInfo.isRegistered;

    // 将之前页面暂存的回调方法一一执行
    this.globalData.isUserInfoInited = true;
    this.globalData.userInfoListeners.forEach((listener) => {
      listener({ userInfo: this.globalData.userInfo, isRegistered: this.globalData.isRegistered });
    });
  },
  // 通过回调方式获取用户信息。有则返回，无则暂存回调方法，等用户信息加载完毕后统一执行
  getUserInfo(cb) {
    if (this.globalData.isUserInfoInited) {
      cb({ userInfo: this.globalData.userInfo, isRegistered: this.globalData.isRegistered });
    } else {
      this.globalData.userInfoListeners.push(cb);
    }
  },
  // 对上面的回调方式进行 Promise 化，可以异步获取用户信息
  getUserInfoAsync() {
    return new Promise((resolve) => this.getUserInfo(resolve));
  },
});
```

在页面中使用时：

```javascript
const app = getApp();

// 回调方式
Page({
  onLoad() {
    app.getUserInfo(({ userInfo, isRegistered }) => {
      // userInfo 一定有值
    });
  },
});

// 异步方式
Page({
  async onLoad() {
    const { userInfo, isRegistered } = await app.getUserInfoAsync();
    // userInfo 一定有值
  },
});
```
