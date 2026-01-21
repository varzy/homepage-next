---
title: '从微信小程序里的 UTC 日期说起'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Miniprogram']
date: '2021-03-15'
slug: 'miniprogram-utc'
summary: ''
last_edited_time: '2025-09-02T07:53:00.000Z'
blog_last_fetched_time: '2025-09-02T09:29:24.719Z'
page_id: 'df57b98c-74de-4187-9f07-21c15fc68c70'
icon: '🛥️'
---

最近在用原生框架开发一个微信小程序，里面涉及不少关于日期的功能，其中一个最简单的功能就是把某个时间转换成年月日去显示。于是我就使用认知中最常用的 `new Date(后端返回的时间)` 转换成 Date 对象进行处理，再结合自己实现的 `formatTime` 函数，在开发者工具中也正常显示出了我需要的 `YYYY 年 MM 月 DD 日` 格式。

看起来一切都很好不是吗？然而如果一切都这么顺利，那就没有这篇文章了。

当我使用开发者工具中的预览功能时，发现在我的 iPhone 11 上显示的却是 `NaN 年 NaN 月 NaN 日`。这就很神奇了。接着我又尝试了真机调试，发现真机调试上也并没有此问题。目前看来似乎只有开发中的预览版会出现这个问题？但我还是决定解决之，毕竟很多 API 都只有在开发版才能进行测试，我毕竟保证手机端的和开发工具中的保持一致。而且，一个破时间而已，能有多难？

## **分析问题**

首先我需要知道究竟是哪一步导致了 NaN。于是采用了最简单粗暴的方式，在页面 onLoad 时逐步打印我对日期的操作，然后对比预览版的输出和开发者工具中的输出。

```javascript
console.log(timeFromApi);
console.log(new Date(timeFromApi));
console.log(formatTime(new Date(timeFromApi)));
```

上面这段代码在开发者工具中输出：

```plain text
2020-07-01T02:14:53.000+0000
Wed Jul 01 2020 10:14:53 GMT+0800 (China Standard Time)
{year: "2020", month: "07", day: "01", hour: "10", minute: "14", …}
```

而在手机端输出：

```plain text
2020-07-01T02:14:53.000+0000
<Date: null>
Object {day:"NaN", hour: "NaN"...}
```

可以看出是在 `new Date()` 这一步出现了异常。

## **问题出在横杠(-)上？**

在 Google 上以 `new Date js ios` 为关键字查找之后，得知 ios 系统下，`new Date()` 不认字符串中的 `-`。网上大部分解决方案都是把 `-` 通过 `replace` 函数转换成 `/`，比如 `2018-11-11 00:00:00` 转换为 `2018/11/11 00:00:00`，这样就可以被 `new Date()` 解析了。

但我勾回过头看后端返回的日期格式，是这样的：`2020-07-01T02:14:53.000+0000`，看起来像是一个 UTC 时间。抱着试一试的心态我也使用了这种方案，果不其然是不可行的，甚至在开发者工具中都报了错，说明仅替换 `-` 字符得到的字符串都不是一种标准的日期格式了。

## **dayjs 一把梭！**

[dayjs ](https://day.js.org/zh-CN/)是一个我一直在使用的用来处理日期和时间的第三方库，大小仅为 2kB，轻量且强大。于是我也在项目中安装了 dayjs，并且通过开发者工具编译成了可被引入的 Npm 模块。查了一下文档，如果需要使用 [UTC 功能](https://day.js.org/docs/zh-CN/parse/utc)，需要引入单独的插件：

```javascript
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
```

然而这时候开发者工具却提示当前目录下的 `dayjs` 文件下找不到 utc 模块。仔细想想，微信开发者工具会把 npm 包进行二次编译，最终结果只有一个 `miniprogram_npm/dayjs` 目录下的 `index.js` 和 `index.js.map` 两个文件，哪里还能再次引入 `dayjs` 下的 `utc.js` 呢。。。果然微信小程序还是和原生的 npm 生态差了好几个光年啊。

而 dayjs 似乎也没有包含全量模块的 `min.js` 文件，于是我就只能放弃了 dayjs 方案。

## **又回到了 moment.js**

于是我就去看了一下老牌的时间处理库 moment.js，它提供了一个具有全量功能的 `moment.min.js` 文件，并且根据[文档](https://momentjs.com/docs/#/parsing/utc/)上的描述，可以直接解析 UTC 日期格式。于是我下载了 `moment.min.js` 放到了项目中。按照文档上的写法，我尝试使用：

```javascript
console.log(moment.utc('2020-07-01T02:14:53.000+0000').valueOf());
```

果然在预览版中得到了正确的时间戳 `1593569693000`。

问题是解决了，但是只为了这一个功能，就需要额外引入一个 57kB 的依赖，这值得吗？

## 有问题找领导

> 领导就是给自己解决问题的。 ——不知道哪里看的名人名言

于是我就把问题发给了我的领导，想看看他有没有类似经验。所谓是大佬一出手，就知有没有。领导研究了一会之后，丢过来了两个链接，并且表示把最后的 `+0000` 改为 `Z` 就可以了。

```javascript
export const UtcToDate = (utc) => new Date(utc.slice(0, -5) + 'Z');
console.log(UtcToDate('2020-07-01T02:14:53.000+0000'));
```

测试后发现果然 Work 了。结合网上的其他资料进行了总结，我也总算是搞懂了一些门道。

## **总结**

先来看后端返回的时间格式：`2020-07-01T02:14:53.000+0000`，可以看出 `2020`，`07`，`01`，`02`，`14`，`53` 其实就是年月日时分秒，中间的 `T` 看起来更像是一个连接符，最后的 `000` 和 `+0000` 我也不晓得什么意思。

于是我以 `UTC 时间格式` 为关键字进行了查询，结合各种资料得知，`000` 指代毫秒，`+0000` 指代时区，而 `+0000` 正是表示标准的国际统一时间，也就是计算机里使用的格林威治时间 (一般情况下可以视为 UTC === GMT)。假如需要指代东八区的时间，那么字符串的最后就是 `+0800`。

看起来如此正常的时间格式，会什么 new Date() 会不认呢？实际上，我在上文中把这种时间格式称为 `UTC` 时间是不准确的。UTC 只是一种时间标准，真正能表示时间格式的标准叫做 `ISO 8601`，这是由国际标准化组织敲定的表示方法，全称为《数据存储和交换形式·信息交换·日期和时间的表示方法》。根据 MDN 文档上的描述，Date 确实能够解析 ISO 格式的时间字符串：

> YYYY-MM-DDTHH:mm:ss.sssZ。时区总是UTC（协调世界时），加一个后缀“Z”标识。

其中的后缀 `Z` 与 `+0000` 同意义，表示 0 时区，所以把 Java 语言中的 `+0000` 转换成 JS 语言中能被 Date 识别的 `Z` 就可以正常解决了。

这个问题从发现到解决一共花了 3 个多小时，远超我的预期。iOS 的 “bug”、dayjs 的不适用等各种巧合让我不得不去深入了解这个问题背后的种种内里。时间的处理是如此得简单，以至于我以为只要把各种各样的时间格式丢给 Date() 就可以得到我想要的时间对象；而时间的处理又是如此得繁琐，以至于遇到稍微复杂一点的问题时我就喜欢用各种第三方库。稍微深究一下，才会发现每一个问题的背后都会有各种各样的细节，这些细节本身或许比解决问题这件事更加有趣。当然，最感谢的其实还是我的领导，本质上是他找到了问题的关键，并且给出了有效的方案。如果只靠我，或许就真的只停留在 moment.js 方案上了。

## **参考资料**

- [时区与JS中的Date对象](https://juejin.im/post/5d23ef766fb9a07ea5681378)
- [https://en.wikipedia.org/wiki/ISO_8601](https://en.wikipedia.org/wiki/ISO_8601)
- [https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString)
- [https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Date/parse](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Date/parse)
- [http://ecma-international.org/ecma-262/5.1/#sec-15.9.1.15](http://ecma-international.org/ecma-262/5.1/#sec-15.9.1.15)
