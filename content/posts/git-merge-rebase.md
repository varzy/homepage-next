---
title: 'Git Merge & Rebase'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Git']
date: '2020-04-09'
slug: 'git-merge-rebase'
summary: ''
last_edited_time: '2025-09-02T07:55:00.000Z'
last_fetched_time: '2025-09-02T09:30:18.550Z'
page_id: 'cc358d04-7cf2-4686-b900-777e3ea1f309'
icon: '🎆'
---

- 绝不要在公共分支上使用 rebase
- 工作流中使用 rebase 最好的用法之一就是清理本地正在开发的分支，隔一段时间执行一次交互式 rebase，你可以保证你 feature 分支中的每一个提交都是专注和有意义的
- 如果你想要一个干净的、线性的提交历史，没有不必要的合并提交，你应该使用 git rebase 而不是 git merge 来并入其他分支上的更改
- merge 后将产生一个新的提交记录

关联阅读：

[在开发过程中使用 git rebase 还是 git merge，优缺点分别是什么？](https://www.zhihu.com/question/36509119)
