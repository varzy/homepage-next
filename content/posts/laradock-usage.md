---
title: 'Laradock 踩坑日记'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Docker', 'Laravel', 'PHP']
date: '2021-03-14'
slug: 'laradock-usage'
summary: ''
last_edited_time: '2025-09-02T07:53:00.000Z'
blog_last_fetched_time: '2025-09-02T09:29:28.426Z'
notion_id: 'e4bc02cb-799b-4efd-bb2f-0965bf16b66e'
icon: '🏸'
---

## Why laradock

之前一直使用 Valet 作为 PHP 开发环境，这家伙确实是简洁优雅，但实际上开发 PHP 远不止将 PHP 跑起来这么简单。近期遇到了一些 Valet 不好解决的问题，因此就想换一套 PHP 开发环境。

刚开始想到的自然是 WAMP 这样的集成开发环境，但是它并不能给我提供一套完整的解决方案，比如我需要使用 Redis，那么我仍然需要在本机部署一套 Redis，对于我这样的内存强迫症来说这是不可接受的。接着便是 Laravel 提供的另一套解决方案: Homestead，这个东西实际上就是 Vagrant 的一个镜像，高度依赖虚拟机，too heavy，不喜欢。最后便想到了 Docker，Google 搜索 Laravel Docker，果真有现成的家伙事，就是 Laradock。

目前 Laradock 的 Star 数量已经大幅超越了 laravel/homestead 和 laravel/valet，并且功能丰富，借助 Docker 的优势也使得这套东西使用起来非常简单流畅。

Laradock 官方文档: [https://laradock.io/](https://laradock.io/)

## 起步

安装 Docker，不再赘述。唯一需要注意的是，如果人在大陆，请务必给 Docker 仓库换源。我使用的源是 Daocloud 的源，地址: [https://www.daocloud.io/mirror](https://www.daocloud.io/mirror)。感谢 Daocloud 提供的免费镜像。

获取 Laracode 源码:

```plain text
git clone https://github.com/Laradock/laradock.gitcd laradockcp env-example .env
```

Laradock 提供了多种使用方式，详见: [https://laradock.io/getting-started/#installation](https://laradock.io/getting-started/#installation)。这里我只介绍多个项目共用一套 Laradock 的情况。

编辑 .env 文件，一般来讲有几个地方是需要设置的:

- `APP_CODE_PATH_HOST`: 映射到本机的文件夹，被映射的目录是下方的的 `APP_CODE_PATH_CONTAINER` 参数值
- `DATA_PATH_HOST`: 容器数据在本机的存储位置。默认是 `~/.laradock/data`，但实测使用这个目录的话，在本机尝试连接 Laradock 的数据库时会提示访问受限，目前没有在网上找到原因。解决方案是指向任意不会有权限问题的文件夹，比如我就将此参数改为了 `./data`
- `WORKSPACE_TIMEZONE`: 国内需要改为 `PRC`
- `PHP_VERSION`: 默认是 `7.2` 版本
- `MYSQL_VERSION`: 默认是 `latest`，但鉴于 mysql 在国内的版本推进速度，这里还是不要使用 8.x 版本了

关于 `APP_CODE_PATH_HOST` 参数，我认为有必要再解释一下。`APP_CODE_PATH_HOST` 默认参数是 `../`，这是由于 Laradock 默认认为 Laradock 应为项目的一个 Git 子模块，但现在我们需要让多个项目使用同一套 Laradock 配置，因此需要将 `APP_CODE_PATH_HOST` 指向项目共同的父文件夹，这样能够方便未来 web server 配置虚拟主机。假如我们有如下的项目结构:

```plain text
+ laradock
+ sites
  + blog
  + mall
```

那么 `APP_CODE_PATH_HOST` 参数的值应为 `../sites`。

配置完成 .env 文件，就可以启动 Laradock 了。

```plain text
docker-compose up -d nginx mysql redis php-fpm workspace
```

首次执行此命令，docker 将生成这些镜像文件，因此这个过程会比较久，请保证网络连接通畅。启动容器后，整个 PHP 开发环境就搭建起来了。可以通过下面的命令进入 Laradock 的容器中:

```plain text
docker-compose exec -it --user=laradock workspace bash
```

这时你就可以通过 composer 安装 Laravel 项目了。`/var/www` 目录下的文件夹在本机的 `APP_CODE_PATH_HOST` 文件夹下也能够看到。

## 配置虚拟主机

在 Laradock 中我使用 Nginx 作为 Web server。配置虚拟主机的方法: [https://laradock.io/getting-started/#B](https://laradock.io/getting-started/#B)。举例，假如我需要运行一个名为 blog 的 Laravel 项目，那么我需要进行以下步骤:

首先配置 Laradock 中 Nginx 的站点。

```plain text
cd ./nginx/sites
cp laravel.conf.example blog.conf
vim blog.conf

# 想要使用的虚拟域名
server_name blog.test;
# /var/www 对应 .env 中 `APP_CODE_PATH_HOST`
root /var/www/blog/public;
```

再配置本机的虚拟域名。

```plain text
sudo vim /etc/hosts

# 加入配置
127.0.0.1    blog.test
```

重新启动 Laradock 容器。

```plain text
docker stop $(docker ps -aq)
docker-compose up -d nginx mysql redis php-fpm workspace
```

在浏览器中输入 `blog.test`，理论上讲此时已经能够看到项目首页了。

## 一键运行

身为懒癌就必须有懒癌的尊严，即便 Laradock 已经如此简单易用，我还是花了几分钟写了个一键运行脚本。如果你需要使用的话，不要忘记替换脚本中的文件夹路径yo~

```bash
#!/bin/bash

cd ~/Code/laradock

print_style() {
  if [ "$2" == "info" ]; then
    COLOR="96m"
  elif [ "$2" == "success" ]; then
    COLOR="92m"
  elif [ "$2" == "warning" ]; then
    COLOR="93m"
  elif [ "$2" == "danger" ]; then
    COLOR="91m"
  else
    COLOR="0m"
  fi

  STARTCOLOR="\e[$COLOR"
  ENDCOLOR="\e[0m"

  printf "$STARTCOLOR%b$ENDCOLOR" "$1"
}

display_options() {
  printf "Available options:\n"
  print_style "   up" "success"
  printf "\t Starts containers\n"
  print_style "   down" "success"
  printf "\t Stops containers\n"
  print_style "   bash" "success"
  printf "\t Opens bash on the workspace with user laradock.\n"
}

if [[ $# -eq 0 ]]; then
  print_style "Missing arguments.\n" "danger"
  display_options
  exit 1
fi

if [ "$1" == "up" ]; then
  if [ $# -gt 1 ]; then
    shift
    SERVICES="$*"
  else
    SERVICES="nginx php-fpm mysql redis"
  fi
  print_style "Starting Docker Compose\n" "info"
  print_style "Your services: ${SERVICES}\n" "success"
  docker-compose up -d ${SERVICES}

elif [ "$1" == "down" ]; then
  print_style "Stopping Docker Compose\n" "info"
  docker-compose stop

elif [ "$1" == "bash" ]; then
  docker-compose exec --user=laradock workspace bash

else
  print_style "Invalid arguments.\n" "danger"
  display_options
  exit 1
fi
```

使用:

```bash
# 不添加参数将默认启动 nginx, mysql, php-fpm, redis 容器
bash ./laradock.sh up

# 也可以根据需要设置需要启动的容器
bash ./laradock.sh up nginx phpmyadmin

# 停止容器
bash ./laradock.sh stop

# 进入 laradock workspace
bash ./laradock.sh bash
```

## 使用 BrowserSync

Laravel Mix 提供了 `mix.browserSync()` 方法实现前端代码的热重载，但是在 Laradock 中使用这个功能似乎有些水土不服，问题主要表现在，主机上无法打开 BrowserSync 代理的地址。Github 上也有关于这个问题的讨论: [https://github.com/laradock/laradock/issues/640](https://github.com/laradock/laradock/issues/640)，但目前似乎并没有完美的解决方案。在此我给出两种本人实测成功的方案。

### 方案一

在代码中直接载入 BrowserSync 的热重载 script 标签。这种方式虽然可行但并不推荐，它侵入了项目代码，并且性能着实不高。

首先编辑 `docker-compose.yml`，在 `workspace` > `ports` 中加入 BrowserSync 的端口映射。

```plain text
ports:
  - "${WORKSPACE_SSH_PORT}:22"
  # BrowserSync 的默认端口，可以根据自己的配置进行修改
  - 3000:3000
  - 3001:3001
```

接着在项目的 `resources/js/bootstrap.js` 中加入以下代码：

```javascript
if (window.$ && process.env.NODE_ENV === 'development') {
  $('body').append(
    `<script async type="text/javascript" src="//localhost:3000/browser-sync/browser-sync-client.js"></script>`,
  );
}
```

在 Laradock 的 workspace 中执行 `yarn watch-poll`，地址栏输入项目地址，就应该能看到热重载的效果了。

我想不明白的一点是，既然能够通过 `localhost:3000` 访问到 BrowserSync 的 JS 脚本，为什么不能使用 `localhost:3000` 直接访问项目？很迷。如果你了解这背后的原因，或者有更好的解决办法，欢迎给我留言或通过邮件联系我。

### 方案二

在本机使用 Npm 或者 Yarn 安装依赖，并且在本机运行 `yarn watch-poll`。我目前正在使用这种方案，优点有:

- 确实能够解决 BrowserSync 的热重载问题，亲测前端资源和 Blade 模板文件都可以被监听
- 充分利用宿主机的性能。像 BrowserSync 这种需要实时监听文件变化并重新编译的工具，自然是性能越强体验越好
- 可以将前端依赖进行缓存
