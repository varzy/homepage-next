---
title: 'Docker Wiki'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Docker']
date: '2020-03-27'
slug: 'docker-wiki'
summary: ''
last_edited_time: '2025-08-06T03:20:00.000Z'
blog_last_fetched_time: '2025-08-06T06:20:46.176Z'
notion_id: '2e91be89-0b92-4360-b17f-b36ba1372b9e'
icon: '🐳'
---

```bash
# 关闭所有容器
docker stop $(docker ps -aq)

# 删除所有容器
docker rm $(docker ps -aq)

# 删除所有镜像
docker rmi $(docker images -q)

# 清理 docker 占用的磁盘空间
docker system prune

# 更加彻底地清理 docker 占用的磁盘空间，将删除未使用过的镜像
docker system prune -a

# 列出所有镜像
docker image ls

# 清理数据卷
docker volume prune

# 查看空间占用情况
docker system df

# 只清理编译缓存
docker builder prune
```

## 创建容器

MySQL

```bash
docker run -d --name lc-mysql -p 3306:3306 -v /Users/zy/Develop/Docking/Data/mysql:/var/lib/mysql -e MYSQL_ROOT_PASSWORD="pswd" mysql:5.7
```

Redis

```bash
docker run -d --name lc-redis -p 6379:6379 -v /Users/zy/Develop/Docking/Data/redis:/data redis redis-server --appendonly yes
```
