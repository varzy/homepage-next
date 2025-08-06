---
title: 'Ubuntu 使用技巧及软件'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Linux']
date: '2020-03-27'
slug: 'ubuntu-skills'
summary: ''
last_edited_time: '2025-08-06T03:20:00.000Z'
blog_last_fetched_time: '2025-08-06T06:19:55.538Z'
notion_id: '6d832d86-e56a-4498-b391-012db20a8b25'
icon: '🎸'
---

## Fuck GFW

### 安装 shadowsocks-qt5

添加 ss-qt5 的源

```bash
sudo add-apt-repository ppa:hzwhuang/ss-qt5
```

如果使用 Ubuntu 18 以上的版本，需要修改源的版本号，修改 `bionic` 为 `xenial`

```bash
cd /etc/apt/sources.list.d/
sudo gedit hzwhuang-ubuntu-ss-qt5-bionic.list
```

更新源，安装 ss-qt5

```bash
sudo apt update
sudo apt install shadowsocks-qt5
```

### 设置 pac 代理

安装 GenPAC

```bash
sudo apt install python3-pip
sudo pip install genpac
```

生成 pac 文件

```bash
genpac --proxy="SOCKS5 127.0.0.1:1080" --gfwlist-proxy="SOCKS5 127.0.0.1:1080" -o autoproxy.pac --gfwlist-url="<https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt>"
```

打开 `系统设置` > `Network` > `Network Proxy`，在 `Automatic` 中的 `Configuration URL` 中输入 pac 文件的路径。

```text
file:///home/zy/Documents/ss/autoproxy.pac
```

### 浏览器使用 pac

SwitchyOmega 官网配置教程: [https://www.switchyomega.com/settings/](https://www.switchyomega.com/settings/)

Chrome 安装插件 SwitchyOmega，在 `auto switch` > `Rule List Config` 中选择 `AutoProxy`，在 `Rule List URL` 中填写: [https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt](https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt)，然后点击按钮更新规则。

在插件中选择 `auto switch` 模式。

## 安装 Dropbox

Dropbox 需要使用 proxychains 才能安装。

安装并配置 proxychains

```bash
sudo apt install proxychains
sudo vim /etc/proxychains.conf
```

在配置文件最后添加 `socks5 127.0.0.1 1080`

启动安装程序

```bash
proxychains dropbox start -i
```

## LNMP

官网地址: [https://lnmp.org/](https://lnmp.org/)

虚拟主机相关: [https://lnmp.org/faq/lnmp-vhost-add-howto.html](https://lnmp.org/faq/lnmp-vhost-add-howto.html)
