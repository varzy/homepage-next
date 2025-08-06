---
title: 'Axios + ElUpload 上传文件'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Vue', 'Axios']
date: '2020-03-27'
slug: 'axios-elupload'
summary: ''
last_edited_time: '2025-08-06T03:20:00.000Z'
blog_last_fetched_time: '2025-08-06T06:20:10.757Z'
notion_id: '152d677d-c599-4ac5-8343-94fcfbedf56d'
icon: '🏮'
---

## axios 配置

```javascript
axios({
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
```

## element ui 配置

```xml
<el-upload :on-change="handleFilesChange"></el-upload>
```

```javascript
handleFilesChange (file) {
	// 通过 raw 属性获取文件对象
	const file = file.raw
}
```

## 上传多个文件构成的数组

```javascript
const formData = new FormData();
files.map((item) => {
  // `file[]` 中的 file 表示字段名
  formData.append('file[]', item);
});
```
