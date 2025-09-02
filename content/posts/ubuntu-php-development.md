---
title: '手工初始化一个基于 Ubuntu 的 PHP 开发环境'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Linux']
date: '2020-03-27'
slug: 'ubuntu-php-development'
summary: ''
last_edited_time: '2025-09-02T06:52:00.000Z'
blog_last_fetched_time: '2025-09-02T07:57:29.479Z'
notion_id: '000201da-d54d-4584-a21b-281605c181c8'
icon: '🏌️‍♀️'
---

```bash
useradd zy -m -g root -s /bin/bash
# 新建用户

passwd zy
# 修改密码

chmod 777 /etc/sudoers
# 打开 sudoers 的编辑权限

vim /etc/sudoers
zy ALL=(ALL:ALL) ALL
# 添加 zy 的 sudo 权限

chmod 440 /etc/sudoers
# 关闭 sudoers 的编辑权限

sudo apt install nginx
sudo apt install mysql-server
# 安装 nginx 和 mysql

sudo vim /etc/mysql/conf.d/mysql.cnf

[client]
default-character-set=utf8

[mysqld]
character-set-server=utf8

[mysql]
default-character-set=utf8
# 设置 mysql 的字符编码

sudo service mysql start
# 启动 mysql

SHOW VARIABLES LIKE 'character%';
# 查看字符编码并保证为 utf8

CREATE USER zy IDENTIFIED BY 'password';
# 创建一个 mysql 用户

GRANT ALL ON *.* TO 'zy'@'%';
# 给 mysql 用户授权

sudo cp /etc/mysql/mysql.conf.d/mysqld.cnf /etc/mysql/mysql.conf.d/mysqld.cnf.bak

sudo vim /etc/mysql/mysql.conf.d/mysqld.cnf
# 注释 bind-adress = 127.0.0.1

sudo apt install php7.0 php7.0-mysql php7.0-fpm php7.0-dev php7.0-mbstring
# 安装 php 及相关扩展

sudo cp ./libraries/config.default.php ./config.inc.php
sudo vim config.inc.php
sudo vim config.sample.inc.php
# 配置虚拟主机，并上传 phpMyAdmin，配置 phpMyAdmin 两个配置文件中的 `$cfg['blowfish_secret']` 为 32 位以上的字符

sudo apt-get install redis-server
# 安装 redis

sudo cp /etc/redis/redis.conf /etc/redis/redis.conf.bak
sudo vim /etc/redis/redis.conf
# 备份 redis 配置并设置后台模式 daemonize yes
# 注释 bind 127.0.0.1
# 取消注释 requirepass 并添加密码
```
