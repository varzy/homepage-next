---
title: '碎片化的 I18n 翻译文件管理'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Vue', 'Node.js']
date: '2025-09-04'
slug: 'fragmented-i18n-translation-file-management'
summary: '碎片管理，产物统一。'
last_edited_time: '2025-09-04T02:14:00.000Z'
blog_last_fetched_time: '2025-09-04T02:15:34.190Z'
notion_id: '264dc9c0-364a-80ec-8a67-c8e64a0549c6'
icon: '⚗️'
---

不管是 Vue 还是 React 生态，前端圈子的 I18n 方案基本都在使用对象或独立的 JSON 文件。对于小型项目可以使用对象，而当涉及团队协作时，使用独立的 JSON 文件可以有效提升团队协作效率。

而随着需要本地化的内容越来越多，翻译文件的行数会越来越多，而任意 JSON 键值需要修改时，就需要手动同步每一个语种的翻译文件，这是一项不复杂但很耗精力也很容易出错的工作。

为此，我们可以借助 Node.js 编写自动化同步脚本来简化这个过程，核心思想即「碎片管理，产物统一」。具体方案是：

1. 将每个语言的翻译文件拆分成一个个的小 JSON 文件，例如：`app.json`, `index_page.json`
2. 以某个基础语种为基准，使用 Node.js 将各个 JSON 的结构自动同步到其他语言中
3. 将每个语言的小 JSON 合并为最终的大 JSON，而各个文件名就作为顶级的键名

实际的目录结果如下：

```bash
├── cli
│   ├── config.ts
│   ├── merge.ts
│   ├── sync.ts
│   └── utils.ts
├── messages
│   ├── en.json # 最终的英文翻译文件
│   └── zh-CN.json # 最终的中文翻译文件
└── partials
    ├── en # 英文的碎片文件，其他语言均以该文件夹的结构为基准
    │   ├── about_page.json
    │   ├── app.json
    │   ├── index_page.json
    └── zh-CN # 中文的碎片文件
        ├── about_page.json
        ├── app.json
        ├── index_page.json
```

partials 目录下存放着所有的碎片文件，en 作为基础语种，开发人员仅需维护 en 目录下的 JSON 文件。举例，当需要新增一个 Pricing 页的翻译文件时，新建 `en/pricing_page.json`，并设计内部的键值对。执行 `cli/sync.ts` 脚本后，zh-CN 目录将自动多出 `zh-CN/pricing_page.json`，且结构与英文版保持完全一致，这时就可以对中文版的翻译内容进行修改了。

当完成了 zh-CN 的所有本地化工作，执行 `cli/merge.ts`，将自动合并所有的碎片文件，在 messages 目录下生成最终产物 en.json、zh-CN.json。

**🔗 cli 下的几个脚本文件代码比较长，已上传** [**Gist**](https://gist.github.com/varzy/d3311523459c82fa8a2d7c7a1fde9359)**。**

为了方便使用，接下来在 package.json 中添加命令，即可执行 `npm run i18n` 一键同步。

```json
"scripts": {
  "i18n:sync": "tsx app/locales/cli/sync.ts",
  "i18n:merge": "tsx app/locales/cli/merge.ts",
  "i18n": "npm run i18n:sync && npm run i18n:merge"
},
```
