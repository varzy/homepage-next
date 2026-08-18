---
title: 'Lumen 使用 Redis'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Laravel', 'PHP']
date: '2020-03-27'
slug: 'lumen-use-redis'
summary: ''
last_edited_time: '2025-08-06T06:20:00.000Z'
last_fetched_time: '2025-09-02T09:32:28.924Z'
page_id: '66384cdd-8a06-4010-b9f5-82cb4e4215f5'
icon: '📇'
---

## 安装依赖

```bash
composer require predis/predis
composer require illuminate/redis
```

## 引入 redis 支持

`bootstrap/app.php` 中写入

```php
$app->register(Illuminate\Redis\RedisServiceProvider::class);
```

## 启用辅助函数

打开 `bootstrap/app.php` 中的注释

```php
$app->withFacades()
$app->withEloquent()
```

## 配置 redis 参数

`.env` 中写入

```plain text
REDIS_HOST=predis
REDIS_HOST=192.168.1.41
REDIS_PORT=6379
REDIS_PASSWORD=123456
```

## 使用 redis

引入 redis 门面或使用 Cache 类

```php
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Cache;
```
