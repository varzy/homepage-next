---
title: '微信小程序中使用 page-container 拦截返回操作'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Miniprogram']
date: '2022-02-21'
slug: 'miniprogram-page-container-reject-backing'
summary: ''
last_edited_time: '2025-08-06T06:16:00.000Z'
blog_last_fetched_time: '2025-09-02T09:27:50.143Z'
notion_id: '2b11d7ee-942d-432c-b223-f2c9d28adfe4'
icon: '🥋'
---

前段时间在小程序里做了个需求，要求**在发帖页面，无论用户以何种方式返回上级页面，都唤起一个询问是否要保存草稿的弹窗**。

微信对于所有的强制操作都限制得比较严格，看似简单的需求背后其实与微信小程序的[设计指南](https://developers.weixin.qq.com/miniprogram/design)相悖，微信自然不可能提供返回拦截这样的 API。虽然在发帖页面内做了保存草稿的按钮，但这并不能解决不小心左滑返回导致草稿内容丢失的问题。

我也针对这个需求做了不少关于返回拦截的调研，网上流传的大部分方案都不太靠谱，即使有些能够成功也实在过于复杂了。当我准备退而求其次使用定时自动保存的方案时，我无意间看到了文档中的 [page-container](https://developers.weixin.qq.com/miniprogram/dev/component/page-container.html) 组件。了解 API 后，我也确实使用这个组件实现了我们的需求，最终效果类似微信发表朋友圈时的弹窗页面。

## 思路

page-container 组件提供了很多生命周期钩子，实现返回拦截效果最重要的就是离开前触发的 `beforeleave` 事件，当使用代码设置 page-container 隐藏，或是用户左滑返回时都会触发 `beforeleave` 事件。

如此一来，我们只需要在 `beforeleave` 中重新将控制 page-container 组件显隐的布尔值重新设置为 `true`，就可以重新打开弹窗，实现类似弹窗不关闭的效果。

## 实现方案

我们使用 `isPageContainerVisible` 变量控制 page-container 组件的显隐，此时还需要引入另一个布尔值 `isPageContainerRealClose` 用来表示下一次是否真正关闭 page-container。接着在 `beforeleave` 中判断 `isPageContainerRealClose` 是否为真。为假则重新将 `isPageContainerVisible` 设置为 `true`，达到重新开启 page-container 的效果。

下面是核心代码：

`index.wxml`

```html
// 发布按钮
<view class="fab" bindtap="onTapFab">+</view>

<page-container
  show="{{ isPageContainerVisible }}"
  position="bottom"
  close-on-slide-down="{{ false }}"
  bindbeforeenter="onPageContainerBeforeEnter"
  bindenter="onPageContainerEnter"
  bindafterenter="onPageContainerAfterEnter"
  bindbeforeleave="onPageContainerBeforeLeave"
  bindleave="onPageContainerLeave"
  bindafterleave="onPageContainerAfterLeave"
  custom-style="z-index: 10000"
>
  <view class="post_fab_wrapper">
    <button class="btn btn-submit" type="primary" bindtap="onPublish">提交</button>
    <button class="btn btn-cancel" bindtap="onClose">取消</button>
  </view>
</page-container>
```

`index.js`：

```javascript
Component({
  data: {
    isPageContainerVisible: false,
    isPageContainerRealClose: false,
  },

  methods: {
    // 使用此方法可以真正关闭 page-container
    realClose() {
      this.setData({ isPageContainerRealClose: true, isPageContainerVisible: false });
    },
    async onPublish() {
      // 提交逻辑...

      this.triggerEvent('published');
      this.realClose();
    },
    // 主动触发关闭，询问是否保存草稿
    onClose() {
      this.askSaveDraft();
    },
    async askSaveDraft() {
      // 如果内容为空，则不保存，直接关闭
      if (!this.data.form.content.trim()) {
        this.realClose();
        return;
      }

      // 保存草稿逻辑...

      this.realClose();
    },

    /**
     * page-container 生命周期
     */
    async onPageContainerBeforeLeave(e) {
      // 进行关闭拦截
      if (this.data.isPageContainerRealClose) {
        this.triggerEvent('close-publisher');
        return;
      }

      // 保持打开
      this.setData({ isPageContainerVisible: true });

      // 问询保存草稿
      this.askSaveDraft();
    },
    // 离开后重置 Publisher 内容
    onPageContainerAfterLeave(e) {
      if (this.data.isPageContainerRealClose) {
        // 重置 isPageContainerRealClose，保证下一次关闭默认被拦截
        this.setData({ isPageContainerRealClose: false });
      }
    },
  },
});
```

## 不足和取舍

此方案在绝大多数情况下都表现得很好，唯一不足的可能是当用户左滑返回时，page-container 将出现一个短暂的先下滑再弹起的动画，造成闪烁。

这是由于用户左滑将先触发 `beforeleave` 后，接着再设置 `isPageContainerVisible` 为 true，相当于 page-container 经历了一次先关闭再打开。而对于使用代码触发的 `beforeleave`，由于 `beforeleave` 和 `isPageContainerVisible` 设为 true 之间的时间间隔极短，并不会出现这种闪烁。

虽然并不是百分百完美，但理论上这已经是目前最简便、最行之有效的可以拦截所有返回操作的方案了。如果有类似的需求，不妨考虑一下这种方案。

## Demo

由于 page-container 也存在一些坑，我编写了一个简单的 Demo：[mp-page-container-demo](https://github.com/varzy/mp-page-container-demo)。欢迎使用和交流。
