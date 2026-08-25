---
title: '博客图床迁移到 Cloudflare R2 全过程回顾'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['个人主页', 'Notion']
date: '2026-08-19'
slug: 'blog-image-host-migration-to-cloudflare-r2'
summary: '感恩赛博菩萨 Cloudflare。'
last_edited_time: '2026-08-25T13:00:00.000Z'
last_fetched_time: '2026-08-25T13:46:17.813Z'
page_id: '3c1dc9c0-364a-80c4-b7ed-fb2ec3daae28'
icon: '🪅'
---

8 月 18 日，我花费了约一晚上和半个白天的时间，把这个网站的图床从 [s.ee](http://s.ee/) 迁移到了 [Cloudflare R2](https://www.cloudflare.com/products/r2/)，目前已经顺利迁移完毕。

## 为什么要迁移

[sm.ms](http://sm.ms/) 几乎是最早一批并且运营至今的图床了，稳定性不错，至少在我使用的过程中没有踩过什么坑。而自从网站升级成 [s.ee](http://s.ee/) 后，加了一些文件分享、短链之类的功能，说实话这些都是我完全用不到的服务，而原本招牌的图床的后台也并没有随着升级变得更好用。

虽然更新频率成谜，但「贼歪」好歹也是个运行 11 年的网站了。我是个严重的数据丢失恐惧症患者，非常重视自己这些没什么人看的东西的可迁移性。这个网站的文字内容在 Notion 和 Git 仓库里是双备份的，但图片却只有 [s.ee](http://s.ee/) 这一处。说白了，我就是怕它跑路🌚。

而 Cloudflare R2 支持标准的 S3 协议，图片的管理和迁移都有标准 API，更重要的是，我希望借助 Cloudflare 的 [Transformations](https://developers.cloudflare.com/images/optimization/transformations/overview/) 功能获取更快的图片访问速度，这也是 s.ee 一直缺失的功能。至于额度，我在 sm.ms 时代就购买了永久会员因此 s.ee 有 500G 的容量，Cloudflare R2 则是 10G，不过对于我的用量来说 10G 也是绰绰有余的。

![99457b911fe142d4.png](https://cdn.varzy.me/public/2026/08/posts/3c1dc9c0-364a-80c4-b7ed-fb2ec3daae28/99457b911fe142d4.png)

## 这个网站的架构

在讲解迁移步骤之前，有必要先说明一下这个网站的大致架构。以发布一篇新文章为例，其生命周期是这样的：

1. 在 Notion 的 Blog 数据库下添加新的页面并编写内容，如果有图片的话，直接扔到 Notion 页面中，该图片将被 Notion 托管
2. 执行 `pnpm fetch:posts` 命令，该脚本将通过 Notion API 获取新页面的内容，并将其中的 Block 转换为标准的 Markdown 格式
3. 在遍历 Block 的过程中，如果发现了图片 Block 并且该图片还没有被上传到自己的图床，那么就下载该图片并上传到图床，再将上传后的 URL 反向写回 Notion。也就是说，所有 Notion 中的图片地址 (https://app.notion.com/image/attachment/xxx.jpg) 最终都会变成图床上的地址 (https://i.see.you/xxx.jpg)
4. 脚本执行成功后，这篇文章会以 Markdown 格式保存到项目的 `/content` 目录下
5. 执行 `pnpm build` 命令，Next.js 会以 SSG 模式输出整个网站的纯静态 HTML

这里可能会有小伙伴提出两个问题：

**Q1：为什么不直接使用 Notion 托管图片而是要上传到自己的图床？**

核心原因是直接上传到 Notion 的图片通过 API 访问时，其链接只有最多两小时的可用时间，超出该时限就无法访问了。

**Q2：为什么设计这么复杂的流程？直接写 Markdown 不好吗？**

我的更新频率已经够低了，如果不找一个随时能写的平台可能一年都更不了几篇🙂‍↔️。

## 迁移过程

总体来说分成了以下几个步骤：

1. 遍历项目 content 目录，提取所有真实在用的图片链接并下载到本地。下载过程中需要保证目录结构和线上完全一致，例如 `https://i.see.you/2026/08/17/foo/bar.jpg` 在本地的路径是 `/2026/08/17/foo/bar.jpg`
2. 将所有图片按原路径上传到 Cloudflare R2。我在 Bucket 下创建了个顶级目录 `legacy`，把以往所有图片都扔到了这个根目录下，最终的路径就是 `https://cdn.varzy.me/legacy/2026/08/17/foo/bar.jpg`
3. 调用 Notion API 遍历所有页面，将每一个图片 Block 的 URL 的前半部分替换为 R2 的 CDN 地址，例如将 `https://i.see.you/2026/08/17/foo/bar.jpg` 替换为 `https://cdn.varzy.me/legacy/2026/08/17/foo/bar.jpg`
4. 直接删掉项目中的 content 目录重建缓存，完成后即可对齐本地文件与 Notion 数据库内容
5. 重新部署上线，搞定

前三步我都是用 Claude 编写了几个临时脚本完成的，这里就不放我的 AI Slop 代码了😅。总之，在脚本编写过程中，需要注意的就是每一步都要建立一定的缓存机制，以及保持幂等原则。由于 Notion API 存在 [Request limits](https://developers.notion.com/reference/request-limits)，像这种大规模的请求很容易摸到上限，这时候就需要保证如果脚本执行出错了，也可以无副作用得无限次重试直至成功。

## 接入 Transformations

如果只是把图片搬到 Cloudflare，那么图片访问速度并不会有什么提升，而 Transformations 就是专门解决这件事的。按照一定的参数拼接图片 URL，Cloudflare 的边缘节点可以很方便得对图片进行裁剪、旋转，以及最常用的压缩等操作，并将转变后的图片直接缓存到 CDN。

至于费用，Transformations 提供了每月 5000 次的 [免费转换额度](https://developers.cloudflare.com/images/pricing/#images-free)，这对我的网站也是完全够用的。

完整的参数文档见 [Features](https://developers.cloudflare.com/images/optimization/features/)，示例：

```plain text
https://cdn.varzy.me/cdn-cgi/image/width=1024,quality=80,format=auto/legacy/2026/08/17/foo/bar.jpg
```

- `width=1024`：转换后的图片宽度设置为 1024px
- `quality=80`：图片质量，设置为 80 一般是看不出什么区别的
- `format=auto`：Cloudflare 按浏览器自行决定转换为 AVIF 还是 WebP
- `metadata=none`：删除图片里的 EXIF 信息
- `onerror=redirect`：如果变换失败，或者超出 5000 次的免费转换额度时就重定向回原图

接下来我们可以结合 `<img>` 标签的 `srcset` 和 `sizes` 两个属性更进一步提升图片的加载速度。我相信很多人都并不了解这两个属性，毕竟比起单独设置 src，这两个属性要复杂得多。如果想进一步了解可以先看看 [Make responsive images](https://developers.cloudflare.com/images/optimization/make-responsive-images/) 这篇精彩的文档。

举例，在 [/taste](https://varzy.me/taste) 页面中的封面图标签大概长下面这个样子。大致解释一下，720px 是我给博客内容区域设置的宽度，当视口小于 720px 时图片会按照 50vw 的宽度来预测渲染宽度。反之图片最大宽度是 240px，不管屏幕多大都绝不会超过这个预测值。

```html
<img
  sizes="(max-width: 720px) 50vw, 240px"
  srcset="
    https://cdn.varzy.me/cdn-cgi/image/width=640,quality=80,format=auto,metadata=none,onerror=redirect/legacy/2026/08/08/d0Mz/taste_3b5dc9c0_1786155772462_d6c.jpg   640w,
    https://cdn.varzy.me/cdn-cgi/image/width=1024,quality=80,format=auto,metadata=none,onerror=redirect/legacy/2026/08/08/d0Mz/taste_3b5dc9c0_1786155772462_d6c.jpg 1024w,
    https://cdn.varzy.me/cdn-cgi/image/width=1536,quality=80,format=auto,metadata=none,onerror=redirect/legacy/2026/08/08/d0Mz/taste_3b5dc9c0_1786155772462_d6c.jpg 1536w
  "
  src="https://cdn.varzy.me/cdn-cgi/image/width=1024,quality=80,format=auto,metadata=none,onerror=redirect/legacy/2026/08/08/d0Mz/taste_3b5dc9c0_1786155772462_d6c.jpg"
/>
```

如果使用 iPhone 12 Pro 访问这个页面，那么 50vw 等于 390 / 2 = 195px，而 Pro 机型的屏幕像素渲染倍率是 2x，最终的渲染宽度就是 195 x 2 = 390px，小于 640px，因此会渲染第一档 640px 的图片。

![a1c76e656b0a3429.png](https://cdn.varzy.me/public/2026/08/posts/3c1dc9c0-364a-80c4-b7ed-fb2ec3daae28/a1c76e656b0a3429.png)

对于 17 Pro Max，由于是 3x 机型，因此渲染宽度是 440 / 2 x 3 = 660px，大于 660 小于 1024，因此会渲染第二档 1024px 的图片。

![6c325f590b75673f.png](https://cdn.varzy.me/public/2026/08/posts/3c1dc9c0-364a-80c4-b7ed-fb2ec3daae28/6c325f590b75673f.png)

而对于尺寸更大、分辨率更高的屏幕，最大也只会渲染 1536px 的图片。

## 成果

经过了这次迁移 & 适配了 Transformations，现在网站上的图片几乎都可以秒开了。直接看一个不严谨但可以反应客观事实的前后对比。

Before：

![d6bc2c97ab2ba3b2.png](https://cdn.varzy.me/public/2026/08/posts/3c1dc9c0-364a-80c4-b7ed-fb2ec3daae28/d6bc2c97ab2ba3b2.png)

After：

![1ce0708c6514672f.png](https://cdn.varzy.me/public/2026/08/posts/3c1dc9c0-364a-80c4-b7ed-fb2ec3daae28/1ce0708c6514672f.png)

最后，千言万语汇成一句话，感恩赛博菩萨 Cloudflare。
