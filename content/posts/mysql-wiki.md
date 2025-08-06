---
title: 'MySQL Wiki'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['MySQL']
date: '2020-03-27'
slug: 'mysql-wiki'
summary: ''
last_edited_time: '2025-08-06T03:20:00.000Z'
blog_last_fetched_time: '2025-08-06T06:20:23.237Z'
notion_id: 'aba74da1-c084-4fd6-94a7-e3c0a6edba2c'
icon: '🤹‍♀️'
---

```sql
[client]
default_character_set=utf8
[mysqld]
character_set_server=utf8
[mysql]
default_character_set=utf8
# 在 ini 配置中设置编码

SHOW VARIABLES LIKE 'character%';
# 查看整体编码

CREATE USER 'demo@localhost' IDENTIFIED by 'demo';
# 创建新的用户

mysqld --default-files="d:/amp/mysql/my.ini"
# 设置 mysql 配置文件位置

SET PASSWORD FOR 'root'@'localhost'=PASSWORD('root');
# 修改用户密码

# 创建一个拥有所有权限的用户
CREATE USER 'zy'@'%' IDENTIFIED BY 'pswd';
GRANT ALL PRIVILEGES ON  *.* TO 'zy'@'%' IDENTIFIED BY 'pswd';
FLUSH PRIVILEGES;
```
