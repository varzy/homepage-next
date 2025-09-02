---
title: 'Vue (Router) 项目在子路径部署'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Vue', 'CICD']
date: '2020-03-27'
slug: 'vue-router-deploy-sub-dir'
summary: ''
last_edited_time: '2025-09-02T08:57:00.000Z'
blog_last_fetched_time: '2025-09-02T09:32:19.520Z'
notion_id: '19275676-eee2-4b8d-8d42-7b744a0b2197'
icon: '🎬'
---

## 方案一：hash 模式

> xxx.com/app1/#/index

- 路由路径直接被前端接管，`#` 后面的是前端路由
- 优点是部署简单
- 缺点是 url 比较反直觉，也不美观

vue.config.js

```plain text
module.exports = {
  // 默认为 /，表示部署在顶级路径上。打包后的静态资源引用路径为 /xxx.js, /xxx.css
  // 使用 ./ 可以使得打包后的 js、css 等资源的引用路径以 ./ 开头
  // 假如需要部署的子路径为 /app1，那么此处也可以写成 /app1/，这样也可以保证正常引用
  publicPath: './',
}
```

router.js

```plain text
export default new Router({
  mode: 'hash',
  ...
});
```

nginx.conf

```plain text
location /app1/ {
    alias /var/www/app1/dist/;
    index index.html;
}
```

## 方案二：history 模式

> xxx.com/app1/index

- 路由都走到 nginx，再由 nginx 转发回前端的入口文件
- 优点是 url 好看，符合直觉
- 缺点是需要配合 Web Server 才能实现

vue.config.js

```plain text
module.exports = {
  publicPath: '/app1/',
}
```

router.js

```plain text
export default new Router({
  mode: 'history',
  ...
});
```

nginx.conf

```plain text
location /app1/ {
    alias /var/www/app1/dist/;
    index index.html;
    try_files $uri $uri/ /app1/index.html;
}
```

## 参考资料

- [Vue Router: HTML5 History 模式](https://router.vuejs.org/zh/guide/essentials/history-mode.html)
- [Vue Cli: publicPath](https://cli.vuejs.org/zh/config/#publicpath)
