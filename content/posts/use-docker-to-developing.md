---
title: '使用 Docker 托管一部分开发环境'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Docker', 'DevEnv', '精选']
date: '2021-09-12'
slug: 'use-docker-to-developing'
summary: ''
last_edited_time: '2025-09-02T07:24:00.000Z'
blog_last_fetched_time: '2025-09-02T07:53:33.502Z'
notion_id: '1f966285-bf21-4640-9e24-11b81c8720a6'
icon: '🐳'
---

## Why & How?

我是一个开发环境洁癖主义者，各种开发环境之间的相互影响非常讨厌，因此我曾经几乎尝试过网上的所有解决方案，比如 GUI 虚拟机、Vagrant、WSL 等等，但这些都有或多或少的缺点，尤其是当我在使用 Windows 系统的时候，开发环境永远是一个痛点。而横向对比下来，Docker 或许是当下最优的解决方案了。虽然 Docker 设计初衷是为了方便进行部署和运维，但只要是能用在生产环境的家伙，当然也能用在开发环境。那 Docker 在开发环境究竟可以做哪些事呢？

1. 我们可以把一些和系统联系不慎紧密的服务使用 Docker 托管，比如 MySQL、Redis、MongoDB 之类的数据库软件。当我们需要使用不同版本的 MySQL 时，只需要拉取一个新的镜像，起一个新的容器即可，而假如用 Homebrew 等包管理工具去管理多个版本的 MySQL 时，就不会像 Docker 这般优雅了。
2. 我们也可以把一些配置异常复杂的软件跑在 Docker 里，比如 Gitlab 这样的巨型项目。
3. 一些平台差异巨大的软件使用 Docker 托管是更好的选择。Nginx 可能是目前世界上最流行的 Web Server，而这种生而为 Linux 服务的软件在 Windows 下的表现并不好 (当然这应该不算是 Nginx 的错)，这时候我们就可以使用 Docker 中的 Nginx，提供与生产环境几乎一致的体验。虽然 Docker 在 Windows，MacOS 和 Linux 上的表现并不完全一致，但绝大部分时间场景下其跨平台特性还是很够用的，能为我们省去很多烦恼。
4. 我们甚至还可以把 Docker 当作一个虚拟机进行项目开发。借助目录、端口映射等功能，我们可以实现类似虚拟机一样的，在宿主机编写代码、在 Docker 容器中运行的效果。如果容器内的开发环境“脏”了，我们只需要重新起一个新容器即可。当然，这种方案会有性能损耗等一系列问题，用来做小一些小项目、或者学习一些新技术进行练手是可以的，但当项目体量足够大时，这种方案可能就会带来各种各样的问题。
5. 如果需要其他同事的项目跑在本机进行联调，比如后端的 Java 或者 PHP 项目，那么可以让他们打成 Docker 镜像，前端同事只需要把镜像跑起来即可，无须本地搭建后端环境。

## docker-compose.yml 以及数据库服务

以 Docker 最常见的托管 MySQL 为例，我们要创建一个能够使用的 MySQL 容器需要两条命令：

```shell
docker pull mysql
docker run --name some-mysql \
  -v ./mysql/conf.d:/etc/mysql/conf.d \
  -v ./mysql/datadir:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=my-secret-pw \
  -d mysql
```

可以看到启动命令其实是比较繁琐的，况且这还是只有一个 MySQL 的情况。当我们有其他版本的 MySQL 或者其他服务需要一起使用时，单纯用命令行操作就显得非常繁琐了。因此我们也需要创建一个属于开发环境的 docker-compose.yml 文件用来管理一切我们需要用到的服务。

首先在你喜欢的位置创建一个文件夹，在其中添加 `docker-compose.yml`。

```yaml
version: "3.8"

services:
	mysql:
			# 启动后的容器名称
	    container_name: mysql
			# 需要使用的镜像及版本
		  image: mysql:latest
			# 总是自动重启
	    restart: always
			# 端口映射
	    ports:
	      - "3306:3306"
			# 数据卷映射
	    volumes:
	      - ./data/mysql:/var/lib/mysql
			# 镜像需要使用的环境变量
	    environment:
	      - MYSQL_ROOT_PASSWORD=pass
	      - TZ=PRC
```

接着我们只需要执行 `docker compose up -d` 就可以直接启动文件中的所有服务。我们还可以给启动命令添加服务名作为参数，表示仅启动指定的服务，比如 `docker compose up -d mysql`。

按照这个思路，我们只需要在 `docker-compose.yml` 中添加自己需要的各种服务即可，比如 Redis、MongoDB 等。下面再给出一个添加了 Redis 和 MongoDB 的完整例子。注意，我们在这里使用了 `redis:alpine` 这个基础镜像，这是因为基于 alpine 这个 linux 发行版的 Docker 镜像体积非常小，没有特殊需求的话，应当尽可能选用 alpine 版本的镜像。

```yaml
version: '3.8'

services:
  mysql:
    container_name: mysql
    image: mysql:latest
    restart: always
    ports:
      - '3306:3306'
    volumes:
      - ./data/mysql:/var/lib/mysql
    environment:
      - MYSQL_ROOT_PASSWORD=pass
      - TZ=PRC

  redis:
    container_name: redis
    image: redis:alpine
    restart: always
    ports:
      - '6379:6379'
    volumes:
      - ./data/redis:/data

  mongo:
    container_name: mongo
    image: mongo:latest
    restart: always
    ports:
      - '27017:27017'
    volumes:
      - ./data/mongo/data:/data/db
      - ./data/mongo/config:/data/configdb
    environment:
      - MONGO_INITDB_ROOT_USERNAME=root
      - MONGO_INITDB_ROOT_PASSWORD=pass
```

## 使用 Nginx

### 起步和初始化

首先，给我们的 docker-compose.yml 中添加 Nginx 相关配置：

```yaml
version: "3.8"

# 隐藏了其他服务
services:
  nginx:
    container_name: nginx
	  image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./sites:/usr/share/nginx/html
      - ./data/nginx/logs:/var/log/nginx
```

从我们映射的目录卷可以看出，`./nginx/conf.d` 是存在配置文件的目录，我们可以把所有的配置文件放在这里；而 `./sites` 则是存放我们网站资源的地方，在编写配置文件时，这个路径需要改为容器路径 `/usr/share/nginx/html`；`./data/nginx/logs` 则用来存放日志。

需要注意的是，`./nginx/conf.d` 目录下是空的，而容器中的 Nginx 在 `conf.d` 下应该有一个默认配置文件 `default.conf`。如果我们直接这么启动容器，就会让容器内的 `conf.d` 目录也变成空目录。因此我们需要提前在宿主机的 `./nginx/conf.d` 下放置一个 `default.conf`。这个文件怎么获取呢？你可以创建一个一次性的 Nginx 容器，把这个配置文件拷贝到宿主机，也可以直接从网上找一个现成的。下面给出一个我从容器内拷贝出来的配置：

```plain text
server {
    listen       80;
    listen  [::]:80;
    server_name  localhost;

    #access_log  /var/log/nginx/host.access.log  main;

    location / {
        root   /usr/share/nginx/html;
        index  index.html index.htm;
    }

    #error_page  404              /404.html;

    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   /usr/share/nginx/html;
    }

    # proxy the PHP scripts to Apache listening on 127.0.0.1:80
    #
    #location ~ \.php$ {
    #    proxy_pass   http://127.0.0.1;
    #}

    # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
    #
    #location ~ \.php$ {
    #    root           html;
    #    fastcgi_pass   127.0.0.1:9000;
    #    fastcgi_index  index.php;
    #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
    #    include        fastcgi_params;
    #}

    # deny access to .htaccess files, if Apache's document root
    # concurs with nginx's one
    #
    #location ~ /\.ht {
    #    deny  all;
    #}
}
```

接下来我们使用 `docker compose up -d nginx` 启动容器，成功后在浏览器打开 `http://localhost`，诶，熟悉的那个 Nginx 启动画面怎么没有了呢？与配置文件目录同理，宿主机下的 `./sites` 是空目录，因此会把容器中的 `/usr/share/nginx/html` 目录也同步为空目录。因此我们可以在 `./sites` 下创建一个 `index.html`。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body style="background-color: bisque;">
    <h1>Nginx is working.</h1>
  </body>
</html>
```

![C9OXoWJA7fLRwt1.png](https://cdn.sa.net/2025/09/02/C9OXoWJA7fLRwt1.png)

大功告成！现在 Nginx 的表现就与宿主机使用 Homebrew 等工具安装 Nginx 后的效果基本一致了。

### 代理静态文件 (正向代理)

接下来我们编写一个简单的 demo。首先创建 `./nginx/conf.d/app.conf`。

```yaml
server {
listen 80;
server_name app.devos.com;

location / {
root /usr/share/nginx/html/app;
index index.html;
}
}
```

可以看出，我们的静态资源目录需要存放在宿主机下的 `./sites/app`，首页文件是 `index.html`，宿主机使用 `http://app.devos.com` 进行访问。

创建 `./sites/app/index.html`。

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body style="background-color: slategrey;">
    <h1>App is working.</h1>
  </body>
</html>
```

接下来我们想访问 `http://app.devos.com` 时仍然访问本机的 Nginx，当然需要在宿主机的 hosts 里添加一条新的记录。注意，不同系统下 hosts 文件位置不同，Mac / Linux 系统下位于 `/etc/hosts`，Windows 系统下位于 `C:\Windows\System32\drivers\etc\hosts` (太鬼畜了这路径)。

```html
127.0.0.1 app.devos.com
```

但这时 `http://app.devos.com` 仍然是无法访问的。这是因为我们更新了 Nginx 的配置文件，但容器中的 Nginx 还没有载入这个配置。因此我们有两种方式：

1. 使用 `docker exec -it nginx sh`，进入容器，然后执行 `nginx -s reload`
2. 直接暴力重启容器，`docker compose restart nginx`

接着我们访问 `http://app.devos.com`，就可以看到已经成功了。

![moNA9IPOuhyHd1F.png](https://cdn.sa.net/2025/09/02/moNA9IPOuhyHd1F.png)

注意，我这里使用了一个非常奇葩的虚拟域名：app.devos.com，这是因为我使用了 Surge 这款梯子，而机场的规则又设置了不认识的域名会直接拦截。。。这就导致我必须使用 .com 之类的大众域名才能访问。你当然可以像网上大部分方案一样使用 .test 作为虚拟域名。

### 反向代理宿主机

在使用 Nginx 过程中，最常见的需求之一就是反向代理。而在我们使用 Docker 中的 Nginx 时，有可能会遇到需要代理宿主机的需求，而 Docker 容器网络默认采用 host 模式，这种模式下宿主机和容器内部网络并不互通。这时候该怎么实现反向代理呢？有两种解决方案。

第一种，将 Nginx 容器的网络改为 bridge 模式，这样就可以与宿主机进行通信，此时只要把宿主机的 ip 地址写在 proxy_pass 处即可。例如：`proxy_pass http://10.18.10.114:3000/api`。但这种方式有很大的弊端，比如当宿主机 ip 变更时，Nginx 配置就需要同步修改，非常繁琐

而第二种方式则是我比较推荐的。Docker 暴露了 `http://host.docker.internal` 这个地址并永远指向宿主机 localhost，因此我们可以在 Nginx 配置中使用这个域名代替宿主机地址。举例：

```plain text
server {
  listen 80;
  server_name app.devos.com;

  # Use [host.docker.internal] to visit host network.
  location /api {
    proxy_pass http://host.docker.internal:3000/api;
  }
}
```

## 把 Docker 容器作为虚拟机进行简单开发

### 舞台搭建

当我们在学习一门新语言、新框架、新技术，亦或是在进行技术选型时，更多情况下只是希望能够简单的体验一下，而为了这个目的在宿主机安装一大堆的依赖、进行繁琐的配置通常是让人不可接受的。因此我们还可以把 Docker 作为虚拟机进行简单的开发。

思路其实非常简单，我们把各种繁琐的配置、语言环境安装在 Docker 容器中，再使用目录映射方式的只把项目代码映射到容器中，我们可以在宿主机编写代码，而运行、编译等过程则全部跑在 Docker 容器中。

下面我们将搭建一个基于 Ubuntu 基础镜像的开发舞台。首先，我们需要对 Ubuntu 基础镜像进行简单的定制，新建 `workspace/Dockerfile` 文件：

```bash
FROM ubuntu:20.04

LABEL maintainer="varzy <varzy@live.com>"

########################################
# Source
########################################
RUN cp /etc/apt/sources.list /etc/apt/sources.list.bak
RUN sed -i 's/archive.ubuntu.com/mirrors.ustc.edu.cn/g' /etc/apt/sources.list
RUN apt update -y

########################################
# Timezone
########################################
ARG TZ=UTC
ENV TZ ${TZ}
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

########################################
# Lang
########################################
RUN apt install -y locales && \
    localedef -i en_US -c -f UTF-8 -A /usr/share/locale/locale.alias en_US.UTF-8
ENV LANG en_US.utf8

########################################
# Basic packages
########################################
RUN apt install -y curl git vim software-properties-common

########################################
# Node, Npm, Yarn
########################################
RUN apt install npm -y && \
    npm config set registry https://registry.npm.taobao.org && \
    npm install -g npm && \
    npm install -g n && \
    n stable
RUN npm install -g yarn && \
    yarn config set registry https://registry.npm.taobao.org && \
    echo 'export PATH="$HOME/.yarn/bin:$PATH"' >> ~/.bashrc && \
    yarn global add @vue/cli prettier eslint serve

########################################
# GO
########################################
RUN apt install golang-go -y
RUN go env -w GOPROXY=https://goproxy.cn,https://gocenter.io,https://goproxy.io,direct
RUN go clean --modcache

########################################
# Final
########################################
# Clean up
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
    rm /var/log/lastlog /var/log/faillog

EXPOSE 22 8000-8100
WORKDIR /workspace
```

可以看到，我们给这个镜像进行换源、设置时区、安装 Node 和 Go 开发环境等操作，并且最终暴露出了 22 和 8000-8100 这些端口，22 用来进行 SSH 链接，而其他项目则需要跑在 8000-8100 端口上。而容器的默认工作目录则是 `/workspace`。

接着我们在 `docker-compose.yml` 中添加一个名为 workspace 的配置。

```yaml
version: '3.8'

services:
  workspace:
    container_name: workspace
    build:
      context: ./workspace
    stdin_open: true # docker run -i
    tty: true # docker exec -t
    volumes:
      - ./code:/workspace
    ports:
      - '22:22'
      - '8000-8100:8000-8100'
```

执行 `docker compose up -d workspace`，即可自动构建 workspace 镜像，并且启动一个新的容器，接下来我们就可以使用 `docker exec -it workspace /bin/bash` 进入容器了。

![jIJWSXu9D67GKZ8.png](https://cdn.sa.net/2025/09/02/jIJWSXu9D67GKZ8.png)

### 开发一个简单的 Go 语言项目

接下来我们会开发一个基于 [Iris 框架](https://www.iris-go.com/)的 Demo 项目。

首先我们还是需要执行 `docker exec -it workspace /bin/bash` 进入容器中，理论上默认工作路径就在 `/workspace` 目录下，接着依次执行：

```bash
mkdir demo-go-iris
cd demo-go-iris
go mod init demo-go-iris
go get github.com/kataras/iris/v12@master
touch main.go
```

此时，宿主机的 `./code/demo-go-iris` 目录下就会出现 `go.mod` 和 `main.go` 两个文件。接下来我们就可以在宿主机编写代码了。比如我们就在 main.go 中添加 Iris 文档中最简单的示例代码：

```go
package main

import "github.com/kataras/iris/v12"

func main() {
    app := iris.New()

    booksAPI := app.Party("/books")
    {
        booksAPI.Use(iris.Compression)

        // GET: http://localhost:8080/books
        booksAPI.Get("/", list)
        // POST: http://localhost:8080/books
        booksAPI.Post("/", create)
    }

    app.Listen(":8080")
}

// Book example.
type Book struct {
    Title string `json:"title"`
}

func list(ctx iris.Context) {
    books := []Book{
        {"Mastering Concurrency in Go"},
        {"Go Design Patterns"},
        {"Black Hat Go"},
    }

    ctx.JSON(books)
    // TIP: negotiate the response between server's prioritizes
    // and client's requirements, instead of ctx.JSON:
    // ctx.Negotiation().JSON().MsgPack().Protobuf()
    // ctx.Negotiate(books)
}

func create(ctx iris.Context) {
    var b Book
    err := ctx.ReadJSON(&b)
    // TIP: use ctx.ReadBody(&b) to bind
    // any type of incoming data instead.
    if err != nil {
        ctx.StopWithProblem(iris.StatusBadRequest, iris.NewProblem().
            Title("Book creation failure").DetailErr(err))
        // TIP: use ctx.StopWithError(code, err) when only
        // plain text responses are expected on errors.
        return
    }

    println("Received Book: " + b.Title)

    ctx.StatusCode(iris.StatusCreated)
}
```

接下来我们回到容器内的终端，执行 `go run main.go`，就可以看到项目已经启动成功了。

![d5XTUfnA7NRKHeL.png](https://cdn.sa.net/2025/09/02/d5XTUfnA7NRKHeL.png)

接下来在宿主机浏览器中访问 `http://localhost:8080/books`。

![ZuRTVpJiSmCwFDG.png](https://cdn.sa.net/2025/09/02/ZuRTVpJiSmCwFDG.png)

能看到这样的效果就说明已经成功了。

### 使用 VSCode 在容器端进行开发

虽然像上面这样的方案已经可以应付大部分 demo 场景，但在宿主机编写代码时，如果宿主机没有安装对应语言环境，可能会出现代码补全异常、代码高亮错误的问题。因此我们可以借助宇宙第一编辑器 VSCode 的一个官方插件：Remote - Container 直接进入容器内部进行开发。除此之外，VSCode 还推出了 SSH、WSL 等各种远程套件，都非常好用。

同时安装 `Remote - Container` 和 `Docker` 两个插件，接着我们就可以在 Docker 插件面板中右键点击 Workspace 镜像，点击 Attach Visual Studio Code，即可打开一个远程连接到容器内的 VSCode 窗口。当我们打开终端，发现默认终端就已经是容器中内的终端了，你在这个窗口内编写的全部代码本质上就已经和宿主机没有任何关系了。

## 开源项目 & DevOS

使用 Docker 作为开发环境越来越火，比如 Laravel 框架前段时间就推出了基于 Docker 的 [Laravel Sail](https://laravel.com/docs/8.x/sail) 用于取代之前主推的虚拟机方案 Homestead。而在此之前网上也有许多优秀的开源项目，比如我之前就写过文章进行介绍的 [Laradock](https://laradock.io/)。Laradock 是一个大而全的、主要服务于 PHP 的开发环境合辑，但实际上你也可以很方便得进行客制化，把它打造成适合自己的开发环境。

而我也斗胆造了个轮子，封装了一些自己常用的服务，并且已经开源：[https://github.com/varzy/DevOS](https://github.com/varzy/DevOS)，欢迎各位帮忙加星星 😉。
