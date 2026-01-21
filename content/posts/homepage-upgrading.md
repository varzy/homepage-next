---
title: '升级了个人主页架构'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Nextjs']
date: '2025-08-06'
slug: 'homepage-upgrading'
summary: '一入 Next 深似海，从此迁移是路人。'
last_edited_time: '2025-08-12T01:52:00.000Z'
blog_last_fetched_time: '2025-09-02T09:25:31.564Z'
page_id: '247dc9c0-364a-806f-9561-fef372d1cbff'
icon: '🕠'
---

在去年二月份之前，我的主页、博客、简历等诸多页面分散在 Cloudflare, Github Pages 和 Vercel 等各个平台，互相通过超链接跳转，而最重要的博客则使用了 [Nobelium](https://github.com/craigary/nobelium) 托管，文章使用 Notion 作为 CMS。但 Nobelium 难以定制，再加上它并未使用 Notion 官方 API，因此我决定从头手撸一个主页项目，并且使用 Notion 的官方 API 来驱动我的博客。

最开始这只是我用来熟悉 Next.js 和 TailwindCSS 的练手项目，没想到做过最后发现完成度意外得不错，目前已开源：[https://github.com/varzy/homepage-next](https://github.com/varzy/homepage-next)。相比 Nobelium，这个项目拥有全面的 TS Support，并且如上文提到的，也采用了 Notion 官方的 [API](https://developers.notion.com/)。

在之前的架构中，我希望能完全使用 Notion 作为博客的 CMS，Next.js 通过 Notion API 拿到 Markdown 格式的页面内容并在服务端渲染，如此一来借助 Next.js 引以为傲的 [Caching](https://nextjs.org/docs/app/guides/caching) 系统，我可以完全在 Notion 中编辑内容，而网站无需任何操作即可实时更新。

可惜现实总不能像理想那般美妙，这套看似合情合理的架构实际操作起来有非常多的问题。首先，为了提升博客中博客页面的访问速度，我必须借助 Next.js 的 `generateStaticParams` API 在编译阶段预渲染页面，但当文章的数量级来到 100+ 时（虽然绝大部分都是毫无营养的废文），无论如何给 API 调用层添加缓存，都极容易摸到 Notion 的 API 调用次数上限，这时候每次上线都变成了一件非常看脸的事情。迫不得已我只能在预编译阶段只渲染每个分类的前十篇文章，即每个分类下第一屏的文章可以秒开，后面的文章则是编写了一个接口，通过调用 `revalidate` API 来手动触发线上的重新缓存。

```javascript
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export function GET() {
  revalidatePath('/', 'layout');
  return Response.json({ ok: true });
}
```

所以当时的上线流程就是推送到 master 分支触发 Vercel 的自动构建，构建完毕后再用 Postman 调用该接口。何等丑陋，何等不可靠🤦。

后续 Next.js 的更新，再加上代码也年久失修，主页的问题越来越多。这次升级前有些页面无论怎么调用 revalidate 也无法重新，我终于决定狠下心升级一下架构了。新架构其实很简单，就是把使用 Notion API 拿 Markdown 这一步前置，提前把所有博客文章拉取到本地得到纯粹的 Markdown 文件，Next.js 只负责渲染 Markdown。

拉取文章的脚本并不复杂，我此前的代码实现是完全可用的， 让 Cursor 参考原有代码几分钟便实现了该脚本。其中最核心的点在于实现脚本的增量更新，即如何知晓哪些文章有更新，需要重新拉取。我的解决方案是在 Notion 的博客数据库中添加一个新的时间戳字段 `blog_last_fetched_time`，而每个页面都有一个由 Notion 自动维护的 `last_edited_time` 字段，该字段将在页面有任意修改时自动更新为最新时间，通过对比这两个字段，只要在执行拉取脚本时 `last_edited_time` 晚于 `blog_last_fetched_time`，则说明需要重新拉取该文章了。拉取完毕后，脚本将再次更新 `blog_last_fetched_time` 为最新时间。

```javascript
const lastEditTime = new Date(post.last_edited_time);
const lastFetchTime = new Date(post.blog_last_fetched_time);
const needsUpdate = lastEditTime > lastFetchTime;
```

而新架构的劣势则在于无法做到文章内容的实时更新，相当于抛弃了 Next.js 的最大优势，几乎重新变成了像 Hexo，Hugo 这样的纯静态博客生成器。而与此同时我得到了更加稳定的部署流程，更加快速的预渲染，以及所有页面几乎秒开的访问速度。基于目前我的忙碌程度和更新频率，无法实时更新这点牺牲是完全可以接受的。

我并未完全采用 Next.js 的纯 SSG 模式，事实上只需要在 next.config.mjs 文件中添加 `output: 'export'` 即可编译为纯静态网站，如此一来我还能快速迁移到 Cloudflare Pages 或 Github Pages 等平台。然而虽然我也极度诟病 Next.js 和 Vercel 如胶似漆，绑定过深，但这俩目前确实是我这套架构的最优选，因此我依旧采用了 SSR 模式 + Vercel。

p.s.，Cloudflare Pages 对于 Next.js 的 SSR 模式支持太差了，如果哪天 Cloudflare Pages 好起来了，我肯定第一时间放弃 Vercel🙈。
