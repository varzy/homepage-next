---
title: 'Ubuntu 18.04 安装搜狗输入法'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Linux']
date: '2020-03-27'
slug: 'ubuntu-install-sougou-input'
summary: ''
last_edited_time: '2025-08-06T03:20:00.000Z'
blog_last_fetched_time: '2025-08-06T06:19:48.247Z'
notion_id: 'd8e8999a-e83d-46b0-b242-7ddf5322046b'
icon: '🤺'
---

来源: [https://www.jianshu.com/p/c936a8a2180e](https://www.jianshu.com/p/c936a8a2180e)

```bash
# 卸载 ibus
sudo apt remove ibus

# 清除 ibus 配置
sudo apt purge ibus

# 卸载顶部面板任务栏上的键盘指示
sudo apt-get remove indicator-keyboard

# 安装 fcitx 输入法框架
sudo apt install fcitx-table-wbpy fcitx-config-gtk

# 切换为 fcitx 输入法，然后重启系统
im-config -n fcitx

# 安装搜狗输入法
sudo dpkg -i sogoupinyin_2.2.0.0108_amd64.deb

# 修复损坏缺少的包
sudo apt install -f

# 打开 fcitx 输入法配置。或从状态栏中打开
fcitx-config-gtk3
```
