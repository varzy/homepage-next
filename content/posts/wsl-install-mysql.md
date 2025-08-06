---
title: 'WSL 下安装 MySQL'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['MySQL', 'WSL', 'Windows']
date: '2020-04-13'
slug: 'wsl-install-mysql'
summary: ''
last_edited_time: '2025-08-06T03:18:00.000Z'
blog_last_fetched_time: '2025-08-06T06:18:52.208Z'
notion_id: 'b9cb2b8b-28d2-4d0c-a379-b583fbad054e'
icon: '📤'
---

安装。由于 wsl 中 root 用户不会创建密码，所以需要手动创建：

```bash
sudo apt install -y mysql-server
sudo mysql -uroot
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'password';
FLUSH PRIVILEGES;
```

完全卸载：

```bash
sudo apt remove --purge *mysql*
sudo rm -rf /etc/mysql /var/lib/mysql
sudo apt-get remove --purge *mariadb*
sudo apt-get autoremove
sudo apt-get autoclean
```
