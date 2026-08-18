---
title: '使用 ohmyzsh 提升终端使用体验'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Terminal']
date: '2021-11-27'
slug: 'ohmyzsh-terminal-usage'
summary: ''
last_edited_time: '2025-09-02T07:52:00.000Z'
last_fetched_time: '2025-09-02T09:28:24.442Z'
page_id: '332a9dfa-7231-40af-899e-43639847c192'
icon: '🧨'
---

## 安装 ohmyzsh

在安装 ohmyzsh 之前，需要先安装 zsh。注意：MacOS Big Sur 之后的默认终端已经是 zsh 了，无须再次安装。

```bash
# 举例，在 Ubuntu 下安装 zsh
sudo apt install -y zsh

# 修改默认终端为 zsh
chsh -s /bin/zsh

# 安装 ohmyzsh
sh -c "$(curl -fsSL https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
```

注意：raw.github.com 在大陆是被墙的，因此这个脚本很有可能下载不下来。你可以先给终端翻墙，或者先手动打开 [https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh](https://raw.github.com/ohmyzsh/ohmyzsh/master/tools/install.sh) 这个地址，再把里面的内容保存到一个本地文件，再尝试安装。网络问题还是挺玄学的，如果安装失败，建议多重试几次。

```bash
vim install-ohmyzsh.sh
# 复制网址中的全部内容后保存
sh ./install-ohmyzsh.sh
```

## 主题

ohmyzsh 拥有千奇百怪的主题。你可以在 `~/.zshrc` 的 `ZSH_THEME=""` 这一行设置你喜欢的主题。

![r9M16o32xTGOWwc.png](https://cdn.sa.net/2025/09/02/r9M16o32xTGOWwc.png)

你可以在 ohmyzsh wiki 的 [themes 页面](https://github.com/ohmyzsh/ohmyzsh/wiki/Themes)浏览全部自带主题。除此之外，Github 上还有非常多未被官方收录的民间主题，有一些确实花哨得夸张。。。

如果你是个喜欢寻求刺激的人，可以尝试设置 `ZSH_THEME="random"`，每次打开终端都是未知的体验（笑。

## 插件

### 自带插件 & 启用插件

ohmyzsh 自带了很多插件，你可以在 ohmyzsh wiki 的 [plugins 页面](https://github.com/ohmyzsh/ohmyzsh/wiki/Plugins)浏览全部，文件夹名字就是插件名字，你可以在 .zshrc 中直接启用。

如何启用插件？打开 `~/.zshrc`，找到 `plugins=(git)` 这一行，括号内填入插件名称并以空格分隔，保存文件后执行 `source ~/.zshrc` 即可看到效果。

![Rbs1KpUT4gAzvI6.png](https://cdn.sa.net/2025/09/02/Rbs1KpUT4gAzvI6.png)

### z

z 是一个 ohmyzsh 自带的插件，它可以记录你去过的所有文件夹，并提供快速跳转。使用时并不需要输入完整的路径，z 会自动进行联想，而且准确度相当高。

![joKYNZIQHExfivV.png](https://cdn.sa.net/2025/09/02/joKYNZIQHExfivV.png)

你可以直接在 `~/.zshrc` 中启用该插件：

```bash
plugins=(z)
```

### autojump

[autojump](https://github.com/wting/autojump) 是一个与 z 类似的一个自动跳转工具，但依赖 python，且需要通过 brew 额外进行安装。我个人觉得 z 就已经够用了。如果你不介意系统上多一个 python 的依赖，可以考虑使用这个插件。

```bash
brew install autojump
```

安装完毕后，在 `~/.zshrc` 中开启该插件：

```bash
plugins=(autojump)
```

### zsh-autosuggestions

[https://github.com/zsh-users/zsh-autosuggestions](https://github.com/zsh-users/zsh-autosuggestions) 插件可以提供一些自动补全建议。

![a8Yzlfj9ZAptnR6.png](https://cdn.sa.net/2025/09/02/a8Yzlfj9ZAptnR6.png)

使用 oh-my-zsh 插件方式安装，并在 `~/.zshrc` 中启用该插件：

```bash
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
```

```bash
plugins=(zsh-autosuggestions)
```

### zsh-syntax-highlighting

[https://github.com/zsh-users/zsh-syntax-highlighting](https://github.com/zsh-users/zsh-syntax-highlighting) 插件可以让命令高亮显示，如果出现语法错误会直接显示为红色。

![Zd7wUB1u8g2czvV.png](https://cdn.sa.net/2025/09/02/Zd7wUB1u8g2czvV.png)

使用 oh-my-zsh 插件方式安装，并在 `~/.zshrc` 中启用该插件：

```bash
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
```

```bash
plugins=(zsh-syntax-highlighting)
```

### themes

[themes](https://github.com/ohmyzsh/ohmyzsh/blob/master/plugins/themes/README.md) 是一个 oh-my-zsh 内建插件，用来快速切换 oh-my-zsh 主题。在 `~/.zshrc` 中启用即可。

```bash
plugins=(themes)
```

### thefuck

虽然 thefuck 并不属于 ohmyzsh 生态，但我觉得还是很有必要安利一波的。

[https://github.com/nvbn/thefuck](https://github.com/nvbn/thefuck) 是一个可以帮你快速纠错命令的工具，当你打错命令了，直接敲一个 fuck，它就会帮你快速纠正。

![qzbJme6pdI8vsRo.png](https://cdn.sa.net/2025/09/02/qzbJme6pdI8vsRo.png)

```bash
# macos 下安装
brew install thefuck

# ubuntu 下安装
sudo apt install -y thefuck
```

在 `~/.zshrc` 中启用：

```bash
eval $(thefuck --alias)
```
