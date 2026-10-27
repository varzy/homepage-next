---
title: "使用 zsh 脚本同步 MacOS 开发环境"
category: "Coding"
type: "Post"
status: "Published"
tags: ["生产力", "MacOS", "Terminal"]
date: "2026-10-27"
slug: "sync-macos-development-environment-with-zsh"
summary: "我有一个强烈的需求就是把两台电脑的开发环境配置为一模一样的状态，包括各种编程语言和软件包的版本。"
last_edited_time: "2026-10-27T08:11:00.000Z"
last_fetched_time: "2026-10-27T08:13:04.956Z"
page_id: "288dc9c0-364a-80a2-a508-c582fbb09e20"
icon: "🪀"
---

我有两台 MacBook，一台是公司配的 MacBook Pro，一台是自己的 MacBook Air。公司的代码都托管在 Github，所以我偶尔也会图轻便带着 Air 出差。因此我有一个强烈的需求就是把两台电脑的开发环境配置为一模一样的状态，包括各种编程语言和软件包的版本。再加上我重装系统的频率也挺高，所以还需要在重装后可以把开发环境快速搭建起来。

## TL;DR

为了解决上述痛点，我把 `~` 中所有需要同步的 dotfiles 放置到 iCloud 的 Documents 下，并勾选「Keep Download」。又编写了一个 zsh 脚本，把这些 dotfile 用软链接的方式重新链接到 `~` 目录，该脚本也会安装和对齐一系列软件，每次重装系统或是任何软件有新版本后，都可以执行该脚本实现一键同步开发环境。

![e2b0b006f40dd16a.png](https://cdn.varzy.me/public/2026/10/posts/288dc9c0-364a-80a2-a508-c582fbb09e20/e2b0b006f40dd16a.png)

## 目录结构

先看看配置文件所在的 `~/Documents/Config` 的目录结构。

```bash
tree -L 2 -a -I '.git|.DS_Store'

.
├── .claude
│   └── settings.local.json
├── dotfiles
│   ├── .agents
│   ├── .cc-switch
│   ├── .codex
│   ├── .cursor
│   ├── .gitconfig
│   ├── .lima
│   ├── .npmrc
│   ├── .snipaste
│   ├── .ssh
│   ├── .vimrc
│   └── .zshrc
├── iterm
│   └── com.googlecode.iterm2.plist
├── logs
├── raycast
│   ├── Raycast 2026-07-31 22.03.19.rayconfig
│   ├── Raycast-X-2026-08-01 11.15.07.rayconfig
│   └── Raycast-X-2026-08-01 11.26.03.rayconfig
└── sync-mac.sh
```

iterm 和 raycast 的软件配置并非是基于 dotfiles 的，不过这两个 GUI 软件的配置相对复杂，备份的需求也很强烈，因此我也使用了自带的备份功能将配置文件导出，后续重装后可以一键导入。

## sync-mac.sh 脚本

sync-mac.sh 已经是一个 1000 多行的巨大 AI Slop 脚本了，你可以在这个 [Gist](https://gist.github.com/varzy/83de3b6452a50b3cd9e65b60ea87d2bc) 中查看完整内容。从上到下这个脚本大概会做这些事情：

1. 测试本地代理环境，避免网络问题导致同步失败
2. 对齐 MacOS 系统设置，例如 Dock 栏尺寸、触控板灵敏度、触发角事件等
3. 安装 ohmyzsh 和插件
4. 把 dotfiles 中的配置文件软链接到 `~`
5. 借助 nvm 安装 LTS 版本的 Node，同时清理过往 Node 版本
6. 执行 `npx skills update` 更新 skills
7. 安装我常用的命令行工具，例如 nvim, lazygit, mole, claude code……
8. 检查更新并升级上一步安装的命令行工具
9. 安装「[Maple Mono NF CN](https://font.subf.dev/)」和「[LXGW Wenkai](https://github.com/lxgw/LxgwWenkai)」这两个字体。前者是我的主力编程字体，后者是我非常喜欢的中文楷体字体
10. 安装「[CC Switch](https://ccswitch.io/en/)」和「[Homebrew-App](https://formulae.brew.sh/cask/homebrew-app)」这两款 GUI。请注意，我并不喜欢用 cask 方式安装 GUI 软件，只有这两款是例外
11. 从 Github 拉取几个自己常用的仓库到 `~/Developer`。由于我的 dotfiles 中提前放好了 `.ssh` 目录，所以这一步可以直接走 ssh 协议
12. 最终，做一次 Homebrew 和 npm 的缓存清理

![cf5995322ef90344.png](https://cdn.varzy.me/public/2026/10/posts/288dc9c0-364a-80a2-a508-c582fbb09e20/cf5995322ef90344.png)

如果你也面临同样的配置同步问题，亦或只是想让自己的开发环境变得更规整，市面上也有类似 [chezmoi](https://chezmoi.io/) 这样的开源方案可供选择。当然，如果你跟我一样有定制化需求，也欢迎你把我的脚本直接丢给你的 AI。
