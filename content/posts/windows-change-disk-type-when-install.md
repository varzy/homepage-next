---
title: 'Windows 安装系统时进行硬盘分区格式转换'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Windows']
date: '2020-03-27'
slug: 'windows-change-disk-type-when-install'
summary: ''
last_edited_time: '2025-08-06T06:20:00.000Z'
blog_last_fetched_time: '2025-09-02T09:33:02.687Z'
notion_id: '6fef0035-1561-4959-a5a4-f95f65a01f27'
icon: '💴'
---

1. 在系统分区界面按 Shift+F10 打开命令提示符
2. 输入：`diskpart`
3. 输入：`list disk` ，打开磁盘信息，可以通过磁盘容量判断将要选择的磁盘
4. 输入：`select disk 0` ，0是指选择第0号磁盘
5. 输入：`clean` ，清空当前磁盘分区及数据
6. 输入：`convert mbr`，转换为 mbr 分区；输入：`convert gpt`，则转换为 gpt 分区
