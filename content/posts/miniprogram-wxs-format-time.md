---
title: '微信小程序中使用 wxs 格式化时间'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Miniprogram']
date: '2021-03-18'
slug: 'miniprogram-wxs-format-time'
summary: ''
last_edited_time: '2025-08-06T06:29:00.000Z'
blog_last_fetched_time: '2025-09-02T09:29:20.258Z'
notion_id: 'c1a9149b-9c3b-4034-9a64-81657b9c5818'
icon: '⛴️'
---

完整代码：

```javascript
var _utcToDate = function (utc) {
  return getDate(utc.slice(0, -5) + 'Z');
};

var _formatNumber = function (num) {
  return +num < 10 ? '0' + num : '' + num;
};

// 关于 getDate 方法的使用
// <https://developers.weixin.qq.com/miniprogram/dev/reference/wxs/06datatype.html#date>
var _getRegularDate = function (date, type) {
  var realDate;
  if (type === 'UTC') {
    realDate = _utcToDate(date);
  } else if (type === 'TimestampByS') {
    realDate = getDate(date * 1000);
  } else if (type === 'TimestampByMS') {
    realDate = getDate(date);
  } else {
    realDate = getDate(date);
  }

  return realDate;
};

var stringifyDate = function (date, type, format = 'yyyy-MM-dd hh:mm:ss') {
  var realDate = _getRegularDate(date, type);

  var date = [
    ['M+', _formatNumber(realDate.getMonth() + 1)],
    ['d+', _formatNumber(realDate.getDate())],
    ['h+', _formatNumber(realDate.getHours())],
    ['m+', _formatNumber(realDate.getMinutes())],
    ['s+', _formatNumber(realDate.getSeconds())],
    ['q+', Math.floor((realDate.getMonth() + 3) / 3)],
    ['S+', realDate.getMilliseconds()],
  ];
  var regYear = getRegExp('(y+)', 'i');
  var reg1 = regYear.exec(format);
  if (reg1) {
    format = format.replace(reg1[1], (realDate.getFullYear() + '').substring(4 - reg1[1].length));
  }
  for (var i = 0; i < date.length; i++) {
    var k = date[i][0];
    var v = date[i][1];
    var reg2 = getRegExp('(' + k + ')').exec(format);
    if (reg2) {
      format = format.replace(reg2[1], reg2[1].length == 1 ? v : ('00' + v).substring(('' + v).length));
    }
  }

  return format;
};

module.exports = {
  stringifyDate: stringifyDate,
};
```

代码并不复杂，其中最核心的部分就是先把各种各样的原始时间格式转化为标准的 `Date` 对象，然后再通过正则匹配给定的时间模板得到最终的字符串。

如果需要支持更多的时间格式，理论上只需要扩展 `_getRegularDate` 方法即可。在上面的代码中支持三种时间格式：

- UTC：`2021-04-11T10:00:49.000+0000`。这种时间格式用了额外的 `_utcToDate` 方法来处理。关于这种时间格式，以及在小程序中的处理，可以查看这篇文章：[从微信小程序里的 UTC 日期说起](https://www.notion.so/df57b98c74de41879f0721c15fc68c70)
- TimestampByS：`1611544428`。精确到秒的 10 位时间戳
- TimestampByMS：`1616053302090`。最常见的精确到毫秒的 13 位时间戳

使用示例：

```html
<wxs src="../../wxs/moment.wxs" module="moment"></wxs>

<view>{{moment.stringifyDate(time, 'TimestampByMS', 'MM月dd日 hh:mm')}}</view>
```
