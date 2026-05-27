---
title: '我当下的 AI Coding 方案'
category: ''
type: 'Post'
status: 'Published'
tags: ['AI']
date: '2026-05-27'
slug: 'my-ai-coding-solution'
summary: 'VSCode + Claude Code 插件 + CodeX 插件 + ZenMux + CC Switch'
last_edited_time: '2026-05-27T01:37:00.000Z'
last_fetched_time: '2026-05-27T10:00:44.242Z'
page_id: '36ddc9c0-364a-80ea-a2d1-e62b1e0020af'
icon: '🏒'
---

TL;DR

- 代码编辑：VSCode + Claude Code 插件 + CodeX 插件
- 模型接入：[ZenMux](https://zenmux.ai/)
- 模型切换：[CC Switch](https://github.com/farion1231/cc-switch)
- 简单任务：Deepseek V4 Pro
- 中等任务：GPT 5.3 CodeX
- 复杂任务：Claude Code Opus 4.7

---

此前我一直是 Cursor 的拥趸，每个月都自动续费 20$ 的入门档，然而最近 Cursor 体感上卡死、断连的次数越来越多，有时候一个 Opus 4.7 的对话走一大半了卡死还是挺恼火的。再加上 Cursor 这个编辑器本身做得实在不怎么样，本身就是 Fork 了 VSCode 的古早版本，很多插件都无法在 Cursor 中正常导入和使用，再加上直到现在都没有自己的云同步机制（我非常重视多设备间无缝切换使用的能力），所以毅然退订了。

目前我已经全面切换到了 ZenMux，相比 Cursor 至少网络连接质量要很多。ZenMux 是我在一场线下 Vibe Coding 活动了解到的，大方得给每一位参赛者都赠送了 20$，试用了之后感觉相当不错，前后我又充值了近 100$。选择 ZenMux 另一个最大的原因是我实在不想和 Anthropic 或者 OpenAI 斗智斗勇，稳定可靠是我这种老登愈发在意的点。

CC Switch 是一个可一键切换模型提供商的应用，应用本身做得不怎么精致，不过该有的功能也都有了。我遇到最大的一个问题是把配置文件的目录丢进 iCloud 云同步后，经常出现两台 Mac 之间配置打架的情况，动不动就不能用了，搞得我现在只能建了个 Git 仓库来同步。

我会在 CC Switch 中添加三套模型，分别是 Deepseek，CodeX 和 Claude Code，分别对应低、中、高三种强度的工作。

![posts_my-ai-coding-solution_36dd.png](https://i.see.you/2026/05/27/4wlF/posts_my-ai-coding-solution_36dd.png)

我个人不怎么用得惯模型厂家自己开发的 TUI，因此我还是会搭配 VSCode 中的插件来使用。我习惯将 Claude Code 和 CodeX 插件放置在右侧边栏，如此一来按下 ⌘ + ⌥ + B 即可快速呼出侧边栏。需要注意的是，每次使用 CC Switch 切换模型后，都需要按下 ⇧ + ⌥ + P 呼出指令面板，再选择 Reload Window 重载一次编辑器窗口。

![posts_my-ai-coding-solution_36dd.png](https://i.see.you/2026/05/27/Shw5/posts_my-ai-coding-solution_36dd.png)
