---
title: '使用 Colima 替代 Docker Desktop'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Docker', 'MacOS']
date: '2022-06-09'
slug: 'colima-replace-docker-desktop'
summary: ''
last_edited_time: '2025-09-02T07:51:00.000Z'
last_fetched_time: '2025-09-02T09:27:21.943Z'
page_id: 'a1f214cb-8dfa-4644-ad8c-c90e00b969ea'
icon: '🎴'
---

Dcoker Desktop 前段时间开始对企业用户收费了，由于我都是使用自己的 Mac 笔记本办公，这就导致我也不能在公司使用 Docker Desktop，因此我就开始寻求 Docker Desktop 的替代品。

说是替代品，但其实我也不怎么用 Docker Desktop 的 GUI，大部分情况下我在使用 VSCode 里的 Docker 插件。因此我的需求并非是 GUI，而仅仅是一个能跑容器的环境罢了。

经过一系列调研，我最终选择了 [Colima](https://github.com/abiosoft/colima)。Colima 是一个开源的 Docker 容器运行时，旨在通过最小化设置运行容器和 Kubernetes。

注意：我在本机跑 Docker 主要是为了承载一部分开发环境，使用场景比较简单，也没有 k8s 之类的需求。项目 README 也表明目前 Colima 仍处于早期开发阶段，请谨慎使用。

## 安装 & 启动

安装启动 Colima 非常简单，只需要以下几条命令：

```bash
brew install colima docker docker-compose
colima start
```

## 自定义 VM 配置

Colima 默认分配 2 核 CPU，2G 内存和 60G 的存储空间。你也可以通过一系列 [参数](https://github.com/abiosoft/colima#customizing-the-vm) 进行自定义：

```bash
colima start --cpu 1 --memory 2 --disk 10
```

## VSCode 中的 Docker 插件

VSCode 中的 Docker 插件同样支持 Colima（所以我愣是没想明白就这破玩意 Docker 怎么好意思向企业用户收费的）。

## 文件写入的权限问题

当我顺利地把 Colima 跑起来，以为万事大吉的时候，坑就来了。

我尝试启动一个 MySQL 容器，但一直失败，查看日志发现容器想要往宿主机的挂载目录写入文件时会报 `chown: changing ownership of '/var/lib/mysql': Permission denied` 的错误。

我查找了项目 Issues，确实有人讨论此问题：[https://github.com/abiosoft/colima/issues/54](https://github.com/abiosoft/colima/issues/54)，但并没有特别优雅且行之有效的解决方案。好在另一篇网友帖子 [记mac下尝鲜colima的坎坷经历 (stanzhai.site)](https://stanzhai.site/blog/post/stanzhai/%E8%A7%A3%E5%86%B3mac%E4%B8%8B%E4%BD%BF%E7%94%A8brew%E7%BC%96%E8%AF%91%E5%AE%89%E8%A3%85colima%E6%8A%A5%E9%94%99%E7%9A%84%E9%97%AE%E9%A2%98#%E5%AE%B9%E5%99%A8%E4%B8%8D%E8%83%BD%E5%86%99%E5%85%A5%E7%BB%91%E5%AE%9A%E5%AE%BF%E4%B8%BB%E7%9B%AE%E5%BD%95%E7%9A%84%E9%97%AE%E9%A2%98) 提到了另一种方案：

```bash
colima start --mount-type 9p
```

试了一下果然可行，并且比起 #54 里的各种方案更加无感。
