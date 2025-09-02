---
title: '基于 WSL 的 Windows 开发环境搭建'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Windows', 'WSL']
date: '2021-11-23'
slug: 'windows-development-env'
summary: ''
last_edited_time: '2025-09-02T07:27:00.000Z'
blog_last_fetched_time: '2025-09-02T07:52:57.870Z'
notion_id: 'a48130c1-4826-4016-8ec3-7166c17a4082'
icon: '🪟'
---

## 基于 WSL 的开发环境搭建

WSL 实际上分为 WSL1 和 WSL2 两个大版本，目前微软主推 WSL2。文中的 WSL 均指 WSL2。

### WSL，What & Why?

- 全名 _Windows Subsystem for Linux_，指 Windows 下的 Linux 子系统。可以秒级启动，比起虚拟机占用资源更少，更加流畅
- 你可以直接用 localhost 访问 Linux 子系统的网络
- 剪切板互通，甚至文件互通
- 你可以直接使用 VSCode 或 WebStorm 等开发工具打开和开发 WSL 中的项目

### 安装 WSL

🔗 官方文档：[安装 WSL | Microsoft Docs](https://docs.microsoft.com/zh-cn/windows/wsl/install)

右键点击开始菜单，以管理员身份打开一个 PowerShell 终端，输入：

```bash
wsl --install
```

安装完毕后重启电脑即可。这条命令会默认安装 Ubuntu 20.04 LTS 发行版。你也可以去 Microsoft Store 下载其他发行版。

重启电脑后，开始菜单就会多出一个 Ubuntu 的图标，点击打开，会让你输入 WSL 的初始用户名和密码，填写后就安装完毕了。

### WSL 换源

```bash
sudo cp /etc/apt/sources.list /etc/apt/sources.list.bak
sudo vim /etc/apt/sources.list
```

阿里源：

```bash
deb http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-security main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-updates main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-backports main restricted universe multiverse
deb http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse
deb-src http://mirrors.aliyun.com/ubuntu/ focal-proposed main restricted universe multiverse
```

更新软件包：

```bash
sudo apt update
sudo apt upgrade
```

### WSL 走宿主机代理

首先，在 Clash for Windows 中打开 `Allow Lan`。接着，我们需要在 Windows 安全中心的防火墙中设置 Clash 允许通过防火墙。

![CeHUBfM2a58XutZ.png](https://cdn.sa.net/2025/09/02/CeHUBfM2a58XutZ.png)

在 WSL 内添加一个脚本：

```bash
#!/bin/sh

# https://zinglix.xyz/2020/04/18/wsl2-proxy/

hostip=$(cat /etc/resolv.conf | grep nameserver | awk '{ print $2 }')
wslip=$(hostname -I | awk '{print $1}')
port=7890

PROXY_HTTP="http://${hostip}:${port}"

set_proxy() {
	export http_proxy="${PROXY_HTTP}"
	export HTTP_PROXY="${PROXY_HTTP}"
	export https_proxy="${PROXY_HTTP}"
	export HTTPS_proxy="${PROXY_HTTP}"
}

unset_proxy() {
	unset http_proxy
	unset HTTP_PROXY
	unset https_proxy
	unset HTTPS_PROXY
}

test_setting() {
	echo "Host ip:" ${hostip}
	echo "WSL ip:" ${wslip}
	echo "Current proxy:" $https_proxy
}

if [ "$1" = "set" ]; then
	set_proxy

elif [ "$1" = "unset" ]; then
	unset_proxy

elif [ "$1" = "test" ]; then
	test_setting
else
	echo "Unsupported arguments."
fi
```

在 .zshrc 中添加 alias：

```bash
alias myip="curl myip.ipip.net"
alias proxy="source $HOME/Library/proxy.sh set"
alias unproxy="source $HOME/Library/proxy.sh unset"
alias proxytest="source $HOME/Library/proxy.sh test"
```

这样一来，我们只需要在终端中执行 `proxy` 即可让 WSL 走宿主机代理，执行 `unproxy` 即可取消。

也可以在 .zshrc 中设置进入终端自动代理：

```bash
source $HOME/Library/proxy.sh set
```

### 安装 Docker

去 Docker 官网下载 [Docker Desktop](https://www.docker.com/products/docker-desktop) 并安装。

Docker Desktop 会自动检测系统是否存在 WSL，如果存在则会以 WSL 作为 Docker Based Engine。

![78UIjJ6GefKHQrc.png](https://cdn.sa.net/2025/09/02/78UIjJ6GefKHQrc.png)

如果需要换源，则打开 Docker Desktop → 设置 → Docker Engine，在 JSON 中添加以下内容：

```bash
{
	// ...
  "registry-mirrors": [
    "http://ovfftd6p.mirror.aliyuncs.com",
    "http://registry.docker-cn.com",
    "http://docker.mirrors.ustc.edu.cn",
    "http://hub-mirror.c.163.com"
  ]
}
```

接着你就可以在 WSL 中正常使用 Docker，并且使用宿主机直接通过 localhost 访问各种 Docker 服务了。

### 安装 VSCODE 远程开发套件

打开 VSCode，搜索并安装插件 [**Remote Development**](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack)**。**点击窗口左下角的图标，即可进入 WSL 等远程环境进行开发。

注意：WSL2 读写宿主机文件的性能很差，因此不要把项目放在 /mnt/c/XXX 这样的挂载目录下，而是应该放在 WSL2 的 ~ 目录下。

### 在 WSL 中安装前端开发环境

推荐使用 [nvm](https://github.com/nvm-sh/nvm) 管理 Node 环境。

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
```

NPM，Yarn，及换源：

```bash
npm i -g yarn
npm config set registry https://registry.npmmirror.com
yarn config set registry https://registry.npmmirror.com
```

### Windows Terminal 及配置

![g2WrwHmeOilvLM1.png](https://cdn.sa.net/2025/09/02/g2WrwHmeOilvLM1.png)

打开 Windows Terminal 的设置，与 VSCode 一样也是基于 JSON 格式的。

- `profiles.list` 可以添加不同的终端 Profile，每个 Profile 都要有一个唯一的 guid
- 可以在 `defaultProfile` 中修改 guid 设置默认的 profile
- 在 `schemes` 中可以添加不同的主题配置，你可以在 [Windows Terminal Themes](https://windowsterminalthemes.dev/) 中找到千奇百怪的配色。添加配置后，可以在不同的 Profile 中添加 `colorScheme` 字段设置主题

  ![TbGNZQarDf5tIi4.png](https://cdn.sa.net/2025/09/02/TbGNZQarDf5tIi4.png)

### WSLG (Preview)

WSLG 旨在让你在 Windows 系统中直接运行 Linux 子系统下的 GUI 应用，除此之外，你还可以借助这项技术让 Linux 系统直接访问 GPU 实现机器学习等功能。虽然这项技术还处于 Preview 阶段，且仅支持 Windows 11，但个人感觉完成度已经很不错了。

以 Linux 经典的文本编辑软件 gedit 为例：

```bash
sudo apt install -y gedit
```

![X3tcGDLZoV8sEmT.png](https://cdn.sa.net/2025/09/02/X3tcGDLZoV8sEmT.png)

### 微信开发者工具

很不幸的是，前端技术栈过于花哨，很难像后端一样把所有的开发工作全部用 WSL 包揽。

以 Pick Pick 小程序为例，在开发时需要实时启动一个 Gulp 构建任务，而微信开发者工具无法直接打开 WSL 中的项目，因此我们不得不在本机再搭建一套前端环境。

其实在 Windows 下做开发，根本就没有所谓的”完美体验“，WSL 的出现也仅仅是解决了一部分痛点。技术从来都是解决多少问题就会带来多少新问题，我们目前只能遵循一个原则：能用 WSL 解决的，最好都用 WSL 解决，实在解决不了的，再上宿主机。

宿主机下的开发环境也许我们并不常用，因此我推荐尽可能使用 Portal 软件。

## 使用技巧

### 你真的需要杀毒软件吗？

Windows 早已自带 Defender 杀毒软件，使用得当的情况下实在没有必要安装第三方杀软。

### 你真的需要 D 盘吗？

可以尝试把 Windows 当成 Unix 系统来使用，只需要一个 C 盘即可。

### 你真的需要使用盗版软件吗？

很多软件都会有开源和免费版本的平替。支持正版和开源软件，从我做起。

### 善用多桌面

Windows 10 就已经支持多桌面了，你可以在不同的桌面放置不同应用，达到多工作区的目的。比如我习惯把杂七杂八的生活娱乐软件都放在第一屏，而第二屏只放开发相关的窗口。

![8LbfNciDtrVR4Y9.png](https://cdn.sa.net/2025/09/02/8LbfNciDtrVR4Y9.png)

### PowerToys

PowerToys 是微软官方出品的工具集，有一大堆非常好用的小工具，比如自动取色、修改快捷键等功能。

![etZ8l1gmJ3E2WPc.png](https://cdn.sa.net/2025/09/02/etZ8l1gmJ3E2WPc.png)

而我主要想介绍其中的 FancyZones 和快捷键修改这两个功能。

FancyZones 可以实现类似 Mac 上快速分屏软件 Magnet 的效果。比如我习惯在编程时把桌面分为两大块，左边放浏览器，右边放代码编辑器，各占五分之四左右的面积。这样我既可以获得足够大的使用面积，又可以只使用一次鼠标点击就在两个窗口间切换。

![jSakxJACT25WKhG.png](https://cdn.sa.net/2025/09/02/jSakxJACT25WKhG.png)

而快捷键切换功能呢，我其实也就自定义了两个快捷键。在 MacOS 下，我最喜欢的快捷键应该就是 ctrl + 1, 2, 3，它可以让我只用左右就快速切换不同的虚拟桌面。反观 Windows 这边，你需要同时按下 win + ctrl + 方向键左右才能实现虚拟桌面的切换，需要同时动用两只手，非常费劲。因此我把 win + ctrl + ⬅ 映射为了 ctrl + 1，把 win + ctrl + ➡ 映射为了 ctrl + 2，鉴于我平时在 Windows 上只会使用两个虚拟桌面，因此这样就可以模拟 Mac 下的虚拟桌面切换体验了。

![i8jvWhuf765xNQR.png](https://cdn.sa.net/2025/09/02/i8jvWhuf765xNQR.png)
