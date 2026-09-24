---
title: '主页 3.2'
category: 'Nichijou'
type: 'Post'
status: 'Published'
tags: ['个人主页']
date: '2026-09-24'
slug: 'my-homepage-3-2'
summary: '体验提升，小修小补。'
last_edited_time: '2026-09-24T03:00:00.000Z'
last_fetched_time: '2026-09-24T03:01:56.199Z'
page_id: '3e4dc9c0-364a-80b1-aa1d-eeb1abb7f9ee'
icon: '🏓'
---

上个版本的更新日志：[主页 3.1](https://varzy.me/posts/my-homepage-3-1)。

## 图床迁移至 Cloudflare R2 及图片优化

将本站用了许久的 [sm.ms](http://sm.ms/) 图床迁移到了 Cloudflare R2，并且配合 [Transformation](https://developers.cloudflare.com/images/optimization/transformations/overview/) 功能大幅提升了图片加载速度。技术方案可见 [博客图床迁移到 Cloudflare R2 全过程回顾](https://varzy.me/posts/blog-image-host-migration-to-cloudflare-r2) 一文。

这是个纯代码向的优化，UI 上几乎没有变更，但这或将成为「贼歪」创刊至今用户体验提升最大的一次更新。

## Slug 和标签更加规范了

此次图片迁移需要重刷一遍代码仓库里的全量文章缓存，因此顺带着把所有文章的标签和 slug 重新修整了一遍。

对部分标签做了合并和重命名，例如 Miniprogram → 微信小程序，ESLint、Prettier 等合并为「工程化」。修复了不少 slug 里的语法错误，例如 how-to-do-ppt 这样的究极低级语病修改为了 how-to-make-ppt。

## 新增了贼歪说的月刊

贼歪说页面新增了「[月刊](https://varzy.me/kotoba/monthly)」页面，可以按月浏览我的牢骚了。月刊中的帖子采用正序排列，也就是从 1 号到 31 号。

与传统的分页模式不同，在月份结束后，对应月刊页面中的卡片数量和内容不会再有任何变化，因此把卡片的 id 粘在 URL 后面即可获得该卡片的永久分享链接。

![8210cf78e26b378a.png](https://cdn.varzy.me/public/2026/09/posts/3e4dc9c0-364a-80b1-aa1d-eeb1abb7f9ee/8210cf78e26b378a.png)

## 往来页面

将首页的「友人」改成了「往来」。目前这个页面还承载了我希望他人在添加友联时使用的本站信息，以及在底部添加了留言板。

我思考了很久要不要给这个页面添加留言板，最终选择加上是因为发邮件毕竟是个相对「重」的行为，至少我每次编写邮件都会有些压力，但留言就显得随意得多。

## 统一了导航栏和标题的文案

统一了文章页 Header 右侧导航和标题的文案，例如此前右上角会显示中文的「文章」，标题会显示英文的「Articles」，现在则都是「文章」了。

![3e80b67420445c88.png](https://cdn.varzy.me/public/2026/09/posts/3e4dc9c0-364a-80b1-aa1d-eeb1abb7f9ee/3e80b67420445c88.png)

此前这么设计主要是出于美观考量，在本站选择的 Noto Serif 字体家族下，英文确实会比两个字的中文好看不少。但现在 Kotoba 右上角也添加了导航栏，场景多了，那逻辑上就更应该统一，以减少使用者的心智负担。

## 做更多的减法

贼歪说卡片的样式得到了进一步精剪，正文上方没有分割线了。至此，本站除了文章中基于 Markdown 自身渲染的分割线外，再无任何一条横平竖直的线段，所有的元素只都靠间距、大小和灰度来区分。

删除了一些废代码，包含未使用的 CSS Theme Token，时间函数等。
