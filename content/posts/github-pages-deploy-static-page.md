---
title: '使用脚本在 Github Pages 部署静态页面'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['CICD']
date: '2020-03-28'
slug: 'github-pages-deploy-static-page'
summary: ''
last_edited_time: '2025-09-02T08:37:00.000Z'
blog_last_fetched_time: '2025-09-02T08:56:57.489Z'
notion_id: '7c7d4b50-2427-4465-aa1b-754d479ad349'
icon: '🎌'
---

## Updated At 2021.03.15

目前这种方式不再被推荐使用了。你应该使用 Github Actions 部署你的静态项目。

---

以主页为例，在项目根目录下添加 `deploy.sh`，填入以下内容：

```bash
#!/usr/bin/env sh

set -e

npm run build

cd dist

echo 'varzy.me' > CNAME

git init
git add -A
git commit -m 'deploy'

git push -f git@github.com:varzy/varzy.github.io.git master

cd -
```

在 `package.json` 中添加命令：

```json
"scripts": {
  "deploy": "bash deploy.sh"
},
```
