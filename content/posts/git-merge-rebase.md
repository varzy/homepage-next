---
title: 'Git Merge & Rebase'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Git']
date: '2020-04-09'
slug: 'git-merge-rebase'
summary: ''
last_edited_time: '2025-08-06T03:19:00.000Z'
blog_last_fetched_time: '2025-08-06T06:18:58.302Z'
notion_id: 'cc358d04-7cf2-4686-b900-777e3ea1f309'
icon: '🎆'
---

- 绝不要在公共分支上使用 rebase
- 工作流中使用 rebase 最好的用法之一就是清理本地正在开发的分支，隔一段时间执行一次交互式 rebase，你可以保证你 feature 分支中的每一个提交都是专注和有意义的
- 如果你想要一个干净的、线性的提交历史，没有不必要的合并提交，你应该使用 git rebase 而不是 git merge 来并入其他分支上的更改
- merge 后将产生一个新的提交记录

[bookmark](https://juejin.im/post/5af26c4d5188256728605809)

[bookmark](https://github.com/geeeeeeeeek/git-recipes/wiki/5.1-%E4%BB%A3%E7%A0%81%E5%90%88%E5%B9%B6%EF%BC%9AMerge%E3%80%81Rebase-%E7%9A%84%E9%80%89%E6%8B%A9)

[bookmark](https://www.zhihu.com/question/36509119)
