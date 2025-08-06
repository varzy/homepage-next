---
title: 'Helpers: JavaScript (JS)'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['JavaScript']
date: '2020-03-27'
slug: 'javascript-helpers'
summary: ''
last_edited_time: '2025-08-06T03:20:00.000Z'
blog_last_fetched_time: '2025-08-06T06:20:05.410Z'
notion_id: '688ce101-11ef-4135-bb9a-c9389764f592'
icon: '🛀'
---

## 异步 Timeout

```javascript
export const asyncTimeout = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
```

## resize 节流

```javascript
export const windowResize = _throttle((cb) => window.addEventListener('resize', cb));
```

## 过滤请求参数

```typescript
/**
 * 过滤请求参数，将去除值为 false 的参数，但不去除值为 0 的属性
 * @param params 请求参数
 */
public static filterParams(params: any): any {
  const result: any = {};
  for (const key in params) {
    if (!params.hasOwnProperty(key)) {
      continue;
    }
    if (params[key] || params[key] === 0 || params[key] === '0') {
      result[key] = params[key];
    }
  }

  return result;
}
```

## Echarts 配置生成器

```typescript
import { EChartOption } from 'echarts';
import _ from 'lodash';

class ChartGenerator {
  private options: EChartOption;

  constructor(baseOptions: EChartOption = {}) {
    this.options = _.cloneDeep(baseOptions);
  }

  public set(path: string, value: any): void {
    _.set(this.options, path, value);
  }

  public merge(options: EChartOption): void {
    _.merge(this.options, options);
  }

  public unset(path: string): void {
    _.unset(this.options, path);
  }

  public changeXAxis(keyMaps: any): void {
    this.set(
      'xAxis.data',
      (this.options.xAxis as any).data.map((item: any) => keyMaps[item]),
    );
  }

  public final(): EChartOption {
    const options = this.options;
    delete this.options;
    return Object.freeze(options);
  }
}

export default (baseOptions?: EChartOption) => new ChartGenerator(baseOptions);
```

## 使用 loadsh 实现银行制数字

只是为了好玩。请使用 `Number.toLocaleString()`

```javascript
// 1234567890
// 1,234,567,890

export const breakNumber = (number) =>
  _(number + '')
    .split('')
    .reverse()
    .chunk(3)
    .map((item) => ',' + item.reverse().join(''))
    .reverse()
    .join('')
    .substring(1);
```

## js 解析 url 参数

```javascript
const getQueryString = (query) => (name) => {
  const reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)');
  const r = query.substr(1).match(reg);
  if (r != null) return unescape(r[2]);
  return null;
};
```

## 在页面上格式化输出 json

html

```html
<pre>
  {{ result }}
</pre>
```

js

```javascript
const result = JSON.stringify(json, null, 4);
```

## 一次性上传多个文件

```javascript
const formData = new FormData();
files.map((item) => {
  // `file[]` 中的 file 表示字段名
  formData.append('file[]', item);
});
```
