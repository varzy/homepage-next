---
title: '使用规则重写让 iOS 下的 Safari 使用 google.com 进行搜索'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['iOS']
date: '2021-08-22'
slug: 'ios-safari-rewrite-by-qx'
summary: ''
last_edited_time: '2025-08-06T03:17:00.000Z'
blog_last_fetched_time: '2025-08-06T06:17:32.623Z'
notion_id: 'd3426c42-b6ef-45eb-9d9e-46129a08411c'
icon: '📏'
---

iOS 系统下，如果我们在设置里把 Safari 的搜索引擎改为 Google，那么 Safari 浏览器默认会使用 [google.cn](http://google.cn/) 进行搜索。但由于众所周知的其他国家的“战略”，我们大概是搜不出什么结果的。当然，如果你开了梯子，那么 Safari 往往会弹出这样的页面：

![ZVHNTChYdqx6FjA.png](https://cdn.sa.net/2024/03/15/ZVHNTChYdqx6FjA.png)

虽然多点一下又不是不能用，但是能一步到位还是更好。事实上我们可以借助梯子软件的重写功能，把 [google.cn](http://google.cn/) 的流量重定向到 google.com。以 QX 为例，我们可以在重写一栏中添加如下规则：

```text
# 用以匹配的 URL
^https?:\/\/(www.)?(g|google)\.cn

# 跳转后的 URL
https://google.com
```

然后保证重写功能打开，重启 QX，再在 Safari 中随便搜点什么，应该就能直接到达 [google.com](http://google.com/) 了。

![HqVk8CugpdN72Bl.png](https://cdn.sa.net/2024/03/15/HqVk8CugpdN72Bl.png)

![zrbnsigSxthWqE1.png](https://cdn.sa.net/2024/03/15/zrbnsigSxthWqE1.png)

![4NPmRzy3b1G2KkL.png](https://cdn.sa.net/2024/03/15/4NPmRzy3b1G2KkL.png)
