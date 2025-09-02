---
title: '不同工作目录应用不同的 .gitconfig'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Git']
date: '2021-11-28'
slug: 'use-different-gitconfig'
summary: ''
last_edited_time: '2025-08-06T06:16:00.000Z'
blog_last_fetched_time: '2025-09-02T09:28:22.630Z'
notion_id: '621ffe9f-028d-4a9b-9f2f-0636defce6f2'
icon: '🏏'
---

我们经常需要在一台电脑上同时开发公司项目和个人项目，不同的项目应该配置不同的 `user.name` 和 `user.email`。

最简单的方案就是在每个项目目录下重新进行配置。我们可以编辑当前目录下 `.git/config` 中的 `[user]` 配置：

```plain text
[user]
    name = aiden
    email = aiden@company.com
```

或者运行以下命令：

```bash
git config --user.name "aiden"
git config --user.email "aiden@company.com"
```

但对于新项目，我们可能很难记得住每次都去执行这样的操作。因此我们可以以文件夹为单位，让不同的项目应用不同的 `.gitconfig` 配置。

假如我们把公司项目都放置在 `~/Company` 目录下，那么我们就可以修改 `~` 目录下的全局 `.gitconfig` 文件，添加以下配置：

```bash
[user]
    name = aiden_nickname
    email = aiden_nickname@personal.com

[includeIf "gitdir:~/Developer/Company/"]
    path = .gitconfig-company
```

Windows 平台用户应该使用这样的路径格式：

```bash
[includeIf "gitdir:C:/Users/<user-name>/Developer/Company/"]
    path = .gitconfig-company
```

接着新建 `.gitconfig-company` 文件，填写公司的用户名和邮箱：

```bash
[user]
    name = aiden
    email = aiden@company.com
```

配置完成后，我们可以进入 `~/Developer/Company` 目录下的任意项目，使用以下命令检查是否生效：

```bash
git config --show-origin --get user.email
```

如果出现 `file:/Users/<user-name>/.gitconfig-company    aiden@company.com` 则说明配置成功。
