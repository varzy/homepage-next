---
title: '开启 iMac 风格的独特主题色'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['MacOS']
date: '2022-11-25'
slug: 'macos-theme'
summary: ''
last_edited_time: '2025-09-02T07:35:00.000Z'
blog_last_fetched_time: '2025-09-02T07:51:18.238Z'
notion_id: '76501d7c-d8a7-413d-90d6-3b2e31f8afb7'
icon: '🎟️'
---

参考：[Use iMac M1 accent colours on any Mac](https://georgegarside.com/blog/macos/imac-m1-accent-colours-any-mac/#:~:text=The%20accent%20colour%20configuration%20is,usually)

这篇博客有讲，是 m1 iMac 彩色版推出以后的功能，可以有对应 iMac 配色的 accent color ，都很好看。感谢楼主发现这个事。

方法就是在 terminal 开启两个命令

```bash
defaults write -g NSColorSimulateHardwareAccent -bool YES
defaults write -g NSColorSimulatedHardwareEnclosureNumber -int 4
```

3 yellow, 4 green, 5 blue, 6 pink, 7 purple, 8 orange

开启以后 settings 里会多一个 This mac 选项，就是这个对应硬件的色彩

记得重启 app 启用更新，重新 log in 。
