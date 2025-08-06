---
title: 'Windows 软件 & 开发环境 (abandoned)'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Windows']
date: '2020-03-27'
slug: 'windows-softwares-and-development'
summary: ''
last_edited_time: '2025-08-06T03:21:00.000Z'
blog_last_fetched_time: '2025-08-06T06:21:10.772Z'
notion_id: '74c86292-e611-4661-b48a-0fc84cfc1dbb'
icon: '🔑'
---

## **软件列表**

- 日常
  - 滴答清单
  - 印象笔记
  - 暴雪战网
  - Steam
  - Logitech G Hub
  - Onedrive
  - 坚果云
- 浏览器
  - Edge by Chromium
  - Chrome
- 媒体
  - 网易云音乐
  - VLC player
- 文档
  - Office / Word
  - Office / Excel
  - Office / Powerpoint
  - 石墨文档
  - Typora
- 沟通
  - Office / Outlook
  - 微信
  - Telegram
  - Tim
  - TeamViewer
  - Skype
- 工具
  - 7-Zip
  - Snipaste
  - Clash for Windows
  - Geek Uninstaller
  - Motrix
- 开发
  - Laragon
    - cmder
    - composer
    - git
    - mysql
    - nginx
    - ngrok
    - nodejs
    - notepad++
    - php
    - redis
    - sendmail
    - tailblazer
    - telnet
    - yarn
  - XSell
  - XFtp
  - VSCode
  - Jetbrains Toolbox
    - WebStorm
    - PhpStorm
    - DataGrip
  - VMware Workstation Pro
  - Postman

## **待选主题色**

- 绿色: `#588780`
- 深灰色: `#3b4044`
- 蓝灰色 (最后一行第四个): `#4a5459`

## 开发环境方案

### 思路

- 尽可能使用集成开发环境 [Laragon](https://laragon.org/) 提供的开发工具和语言环境，如 Node，PHP，Git 等。如若不能满足需求，则替换为其他工具
- 服务类程序，如 MySQL，Redis 等，尽可能使用远程 Linux 主机的。没有时则尝试使用 Laragon 提供的服务。如果不能满足需求，则在本机起虚拟机用于承载这些服务

### IP 与别名

为了避免虚拟机或远程主机重装后 IP 变更对开发环境产生的影响，应当将所有的虚拟环境取别名，并在 hosts 中配置。未来 IP 改变后仅需要修改 hosts 文件即可。

- 虚拟机、WSL、本地其他主机：均以 `lc_` 开头
- 远程主机：均以 `rm_` 开头

## 搭建虚拟机开发环境

目前选用 VMware + Ubuntu 18.04 server 版，配置为 1 核 2G。

### MySQL

安装：

```bash
sudo apt install -y mysql-server
```

允许远程连接：

```bash
# 允许 mysql 远程连接
sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf
# 注释此行 bind-address = 127.0.0.1
# bind-address          = 127.0.0.1

# 重启 MySQL
sudo service mysql restart
```

创建一个新用户：

```sql
# 查看 MySQL 的默认用户名和密码
sudo cat /etc/mysql/debian.cnf
# 此处的用户名和密码是上方配置文件中的 user 和 password 字段
mysql -udebian-sys-maint -pxxx

CREATE USER 'zy'@'%' IDENTIFIED BY 'pswd';
GRANT ALL ON *.* TO 'zy'@'%';
FLUSH PRIVILEGES;
```

### **Redis**

安装：

```bash
sudo apt install -y redis-server
```

配置：

```bash
sudo vim /etc/redis/redis.conf
# 允许外部连接。注释 bind 127.0.0.1 ::1
# bind 127.0.0.1 ::1
# 关闭保护模式。yes => no
protected-mode no

# 重启 redis
sudo systemctl restart redis
```
