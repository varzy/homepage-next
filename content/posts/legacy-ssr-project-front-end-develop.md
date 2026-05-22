---
title: '前后端不分离，也要优雅得写前端！'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['JavaScript']
date: '2021-03-13'
slug: 'legacy-ssr-project-front-end-develop'
summary: ''
last_edited_time: '2025-09-02T07:54:00.000Z'
last_fetched_time: '2025-09-02T09:29:31.198Z'
page_id: 'dadd4c37-7881-4ba1-99f4-cd51210c3922'
icon: '🚎'
---

实不相瞒我已经很久没有写过前后端不分离的项目了，几乎都是 `vue create xxx` 一把梭。我喜欢前后端分离的开发模式，好处是不会相互干扰，各干各的，前端不需要装 PHP 或者 Python 才能把项目跑起来，后端也不需要再去套模板渲染数据。但往往处于 SEO 等各种需求，有些项目还真就不能前后端分离了事，这种情况下怎么优雅得编写前端代码就是个大坑。

最近接触了一个基于 Django 框架，前后端不分离的项目，关于如何优雅得编写前端我也想了很多，最终花了一天多的时间搞了一套感觉还算是普适性不错、实施也比较简单的方法论。这篇文章将会讲解我的思路，并且以 Django 框架为例给出 Demo。

当然，这套架构还很不完善，但对于中小型项目来说总归是利大于弊的。

## 传统是什么样的？

首先我们会新建一个基础的布局文件 `base.html`:

```html
{% load static %}
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Demo</title>
    <link rel="icon" type="image/png" href="{% static 'favicon.ico' %}" />
    <link rel="stylesheet" href="{% static 'css/reset.css' %}" />
    <link rel="stylesheet" href="{% static 'css/bootstrap.min.css' %}" />
    {% block styles %} {% endblock %}
  </head>
  <body>
    {% block content %} {% endblock %}

    <link rel="stylesheet" href="{% static 'js/jquery.min.js' %}" />
    <link rel="stylesheet" href="{% static 'js/bootstrap.min.js' %}" />
    {% block scripts %} {% endblock %}
  </body>
</html>
```

接着我们会创建一个首页的模板文件 `index.html`，它继承了基础的模板：

```html
{% extends "../layouts/base.html" %} {% load static %} {% block styles %}
<link rel="stylesheet" href="{% static 'css/index.css' %}" />
{% endblock %} {% block content %}
<div class="index">
  <div id="indexCarousel" class="carousel slide" data-ride="carousel">...</div>
  <button class="btn"></button>
</div>
{% endblock %} {% block scripts %}
<script src="{% static 'js/index.js' %}"></script>
<script>
  $('.btn').click(function() { ... })
</script>
{% endblock %}
```

当在 `urls.py` 里为 `index.html` 加上路由之后，页面将被成功地运行起来，简直棒呆了——吗？

## 痛点在哪里？

上面那些看似合情合理的代码其实有非常多的槽点。

首先，你的代码编辑器大概率会因为找不到 `$` 变量而提示一个波浪线 (如果你的编辑器不是 Notepad 或者 Editplus 的话)

其次，页面中的 CSS 文件和 JS 代码都必须考虑浏览器的兼容性，这意味着绝大部分新鲜的语法都不能直接使用，并且伴随着大量的 `-webkit-` 和 `var that = this`。

再次，JS 逻辑将会毫无保留得全部暴露，网站的安全性大打折扣。

最后，如果每个页面引入的文件都不一样，每次进入页面因为加载资源而产生的 HTTP 请求数量将会很多，大幅增加用户等待时间。

## 怎样才算优雅？

- 我想用 ES6、TS、Vue、React……
- 我想用 Sass、Less、Stylus……
- 我想用 Prettier、ESLint……
- 我想自动混淆前端的变化名……
- 我想给资源自动添加版本号……
- 我还想实现浏览器自动刷新、模块热重载……

不得不说，如今的前端就像三里屯的姑娘，BlingBling 的外表来源于一万个瓶瓶罐罐，但假如她把妆卸了，他的男朋友又会捂着脸说：“嗨，你还是全副武装的样子更诱人”。

## 那就优雅一把

> 不管你代码长什么样，只要我认，这个页面就能跑。——IE 以外的浏览器

既然有了这条铁律，那么我们只需要在五花八门的各类模板引擎中，想办法加载静态资源就可以了。至于我们的源码是 TS 还是 JS，是 Sass 还是 Less，图片是在线地址还是 Base 64 都无所谓。感谢 Node.js，Webpack，Gulp……虽然大部分时间我都恨死了她们，但有了她们，我们就可以对前端资源为所欲为了！

以 Django 项目为例，我的思路是这样的：

- 所有的前端资源都放在根目录下，方便通过 npm 进行管理
- 使用 Webpack 等工具对前端项目进行打包后，自动输出到 `/project/static` 目录下
- 基础的布局文件永远只引入 `static` 下几个打包后的资源文件
- 对于某些无法被打包工具处理的资源，直接复制到 `static` 目录下进行引用
- 所有的 JS 逻辑都尽可能得通过 Webpack 进行处理，页面上通过一个加载器注册当前页面需要的功能

迫于自己的 Webpack 能力实在捉急，我选用了 [Laravel-Mix](https://laravel-mix.com/) 来处理前端资源。实际上这种思路已经不再挑框架和打包工具了，可以把 Django 换成其他任意框架，Laravel-Mix 换成自己手动配置的 Webpack 和 Gulp，都是没有问题的。

首先安装一些必要的前端依赖，并且创建基础的资源目录。

```bash
npm init -y
npm i -D laravel-mix prettier eslint ...
npm i jquery lodash bootstrap normalize.css ...

touch webpack.mix.js
mkdir -p resources/{js,scss}
```

在 `webpack.mix.js` 中进行基础的 Laravel-Mix 配置。详细的配置可以参考 Laravel-Mix 的官方文档。

```javascript
const mix = require('laravel-mix');

const calcSrcPath = (path) => `./resources/${path}`;
const calcDistPath = (path) => `./jgmsys/static/${path}`;
// 此处请根据自己的 ip 地址进行替换。本机开发一般为 localhost
// 端口与 Django 开发环境的端口号一致。如果使用了 nginx，则与该站点的 nginx 端口一致
const djangoServer = '0.0.0.0:8000';

mix
  .js(calcSrcPath('js/bootstrap.js'), calcDistPath('js'))
  .js(calcSrcPath('js/app.js'), calcDistPath('js'))
  .sass(calcSrcPath('scss/app.scss'), calcDistPath('css'))
  .copy(calcSrcPath('favicon.ico'), calcDistPath('favicon.ico'))
  .copyDirectory(calcSrcPath('vendor'), calcDistPath('vendor'))
  .extract(['jquery', 'bootstrap', 'lodash', 'normalize.css', 'vue', 'popper.js']);

mix.setPublicPath(calcDistPath()).disableSuccessNotifications().browserSync(djangoServer);

if (mix.inProduction()) mix.version();
```

在 `package.json` 中添加 Laravel-Mix 的相关脚本，此处仅写出几个最常用的作为示例。其他脚本详见 Laravel-Mix 官网。

```json
"scripts": {
    "development": "cross-env NODE_ENV=development node_modules/webpack/bin/webpack.js --progress --hide-modules --config=node_modules/laravel-mix/setup/webpack.config.js",
    "watch": "npm run development -- --watch",
    "production": "cross-env NODE_ENV=production node_modules/webpack/bin/webpack.js --no-progress --hide-modules --config=node_modules/laravel-mix/setup/webpack.config.js"
},
```

在 `resources` 目录下自由添加需要被处理的前端资源，然后运行 `npm run watch`，如果使用了 Laravel-Mix 的 `browserSync` 服务，那么在浏览器中打开 `ip:3000` 就可以看到能够自动热重载的页面了！

## 如何组织前端资源

当把所有的基建工作都做完之后，就要考虑如何有效得组织资源。下面是我目前正在使用的项目结构。

```plain text
├── favicon.ico
├── iconfont
│   └── ...
├── js
│   ├── app.js
│   ├── bootstrap.js
│   ├── components
│   │   └── HelloWorld.vue
│   ├── features
│   │   ├── ChangeBgc.js
│   │   └── main.js
│   └── loader.js
├── scss
│   ├── app.scss
│   ├── _bootstrap.scss
│   ├── _common.scss
│   ├── _hack.scss
│   ├── _iconfont.scss
│   ├── layouts
│   │   └── _base.scss
│   ├── _mixins.scss
│   ├── _reset.scss
│   ├── _variables.scss
│   └── widgets
│       ├── _footer.scss
│       └── _header.scss
└── vendor
    └── swiper
        ├── swiper.min.css
        └── swiper.min.js
```

`app.scss` 用于注册所有的样式文件。当然，如果有多个布局，可以考虑对其进行拆分。

```scss
// resources
@import "variables";
@import "mixins";
@import "iconfont";
// reset
@import "~normalize.css/normalize.css";
@import "reset";
// libraries
@import "common";
@import "bootstrap";
// views
@import "layouts/base";
...
// hack
@import "hack";
```

`bootstrap.js` 用于注册全局都需要使用的、需要预先加载的功能模块。

```javascript
window._ = require('lodash');
window.$ = window.jQuery = require('jquery');
require('popper.js');
require('bootstrap');
```

`app.js` 和 `loader.js` 需要着重讲解一下。为了能让所有的 JS 逻辑都尽可能得被打包工具进行处理，因此我们需要把不同的功能拆分成 JS 模块在 `app.js` 中统一引入。但有些功能可能仅用于一部分页面，并且可能会出现复用的情况，因此我们不可能只靠引入 `app.js` 解决所有问题。

我给出的解决方案是：

- **所有的功能都在** **`app.js`** **中注册，但并不执行。为了实现这样的效果，我们可以约定每一个功能都必须是一个函数**
- **何时触发功能，以及触发什么功能都在页面中进行维护**
- **页面通过加载器** **`loader.js`** **加载当前页面需要用到的功能，待页面 onload 后自动触发**

听起来很复杂，但实际上代码实现是相当简单的：

`app.js`。引入所有 JS 逻辑。

```javascript
// 功能加载器
import './loader';
// 所有的功能
import './features/main';
// Vue 相关
import Vue from 'vue';
import HelloWorld from './components/HelloWorld';

new Vue({
  el: '#app',
  components: { HelloWorld },
});
```

`loader.js`。Features 内加载全部的功能模块，每个页面只需要在 `RegisteredFeatures` 数组中 push 合适的功能模块，页面 onload 后将自动全部执行。

```javascript
window.Features = {};
window.RegisteredFeatures = [];

window.onload = function () {
  window.RegisteredFeatures.forEach((feature) => feature());
};
```

`features/main.js`。注册全量的功能模块，每一个模块都必须是一个方法。

```javascript
import { ChangeBgc } from './ChangeBgc';

window.Features.ChangeBgc = (...args) => {
  new ChangeBgc(...args);
};

window.Features.Demo = () => {
  console.log(`I'm just a demo...`);
};
```

`features/ChangeBgc.js`。这是一个使用面向对象的例子。

```javascript
import $ from 'jquery';

export class ChangeBgc {
  constructor(trigger, bgc) {
    this.bgc = bgc;
    $(trigger).click(this.triggeredClick.bind(this));
  }

  triggeredClick() {
    $('body').css('background-color', this.bgc);
  }
}
```

`layouts/base.html`。引入了打包后资源路径的模板文件。

```html
{% load static %}
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="ie=edge" />
    <title>Demo</title>

    <link rel="icon" type="image/png" href="{% static 'favicon.ico' %}" />
    <link rel="stylesheet" href="{% static 'css/app.css' %}" />
    {% block styles %} {% endblock %}
  </head>
  <body>
    <!-- 作为 Vue 的根元素，这个标签内部可以任意使用全局注册的 Vue 组件 -->
    <div id="app">{% block content %} {% endblock %}</div>

    <script src="{% static 'js/manifest.js' %}"></script>
    <script src="{% static 'js/vendor.js' %}"></script>
    <script src="{% static 'js/bootstrap.js' %}"></script>
    <script src="{% static 'js/app.js' %}"></script>
    {% block scripts %} {% endblock %}
  </body>
</html>
```

`index.html`。项目的首页，假定需要使用 `Demo` 和 `ChangeBgc` 两个功能，因此在 `RegisteredFeatures` 中 push 两个方法即可。

```javascript
{% extends "../layouts/base.html" %}
{% load static %}

{% block content %}
<div class="index">
  <button class="btn">Change Bgc</button>
</div>
{% endblock %}

{% block scripts %}
<script>
  RegisteredFeatures.push(
    Features.Demo,
    function() { Features.ChangeBgc('.btn', '#ccc') }
  )
</script>
{% endblock %}
```

现在打开项目的首页，控制台将打印来自 `Features.Demo` 的 `I'm just a demo...`，并且点击按钮后页面的背景色将变为 `#ccc`。How Elegant!
