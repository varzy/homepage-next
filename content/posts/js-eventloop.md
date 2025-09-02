---
title: 'JS 事件循环；宏任务，微任务，setTimeout'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['JavaScript', '八股文']
date: '2020-04-07'
slug: 'js-eventloop'
summary: ''
last_edited_time: '2025-09-02T07:55:00.000Z'
blog_last_fetched_time: '2025-09-02T09:30:23.684Z'
notion_id: '19432983-024c-4bda-b71d-1318eb406037'
icon: '🥎'
---

## JS 事件循环

- JS 是单线程的语言，JS 里面的任务要一个一个执行。为了提高运行速度，JS 将任务分为 `同步` 和 `异步` 两类，但本质上异步是 JS 用同步的方法模拟的
- js 事件循环机制，决定了代码执行顺序
- 在单次的事件循环中，JS 执行某个宏任务后会检查是否有微任务存在，如果有则处理完微任务，再开启下一个宏任务。如果没有下一个宏任务，则开启下一次事件循环

表述：

- 同步和异步任务分别进入不同的执行"场所"，同步的进入主线程，异步的进入 Event Table 并注册函数
- 当指定的事情完成时，Event Table 会将这个函数移入 Event Queue
- 线程内的任务执行完毕为空，会去 Event Queue 读取对应的函数，进入主线程执行
- 上述过程会不断重复，也就是常说的 Event Loop

举例：

```javascript
let data = [];
$.ajax({
  url: www.javascript.com,
  data: data,
  success: () => {
    console.log('发送成功!');
  },
});
console.log('代码执行结束');
```

1. ajax 请求进入 Event Table
2. 主线程执行 `console.log()`
3. ajax 执行完毕后，`success` 方法进入 Event Queue
4. 主线程从 Event Queue 读取回调函数 `success` 并执行

## 宏任务，微任务，setTimeout

- 宏任务与微任务
  - macro-task (宏任务)：包括整体代码 `script`，`setTimeout`，`setInterval` 等
  - micro-task (微任务)：`Promise.then`，`process.nextTick` 等
  - 具体是宏任务还是微任务，与浏览器、运行环境都有关系
- 在一个 Event Loop 中，微任务未执行完毕前，不会执行下一个宏任务
- 宏任务和微任务执行完成后都会判断是否还有微任务，有的话执行微任务，没有就执行宏任务，如此循坏
- **setTimeout 作为一个宏任务，延迟参数设为 0 时，只能表示尽快执行。一**般浏览器中其 delay 时间最短为 `4ms`。详细信息见 [MDN](https://developer.mozilla.org/zh-CN/docs/Web/API/Window/setTimeout#%E5%AE%9E%E9%99%85%E5%BB%B6%E6%97%B6%E6%AF%94%E8%AE%BE%E5%AE%9A%E5%80%BC%E6%9B%B4%E4%B9%85%E7%9A%84%E5%8E%9F%E5%9B%A0%EF%BC%9A%E6%9C%80%E5%B0%8F%E5%BB%B6%E8%BF%9F%E6%97%B6%E9%97%B4)。

举例1：

```javascript
setTimeout(() => console.log('setTimeout-1'), 0);

async function todo1(params) {
  console.log('todo1-await-above');
  await Promise.resolve(99);
  console.log('todo1-await-under');
}

todo1();

new Promise((resolve, reject) => {
  console.log('promise-1');
  resolve();
}).then((data) => {
  console.log('promise-then-1');
});

console.log('end');

// todo1-await-above
// promise-1
// end
// promise-then-1
// todo1-await-under
// setTimeout-1
```

解析：

- 开启一个事件循环
- 这段代码作为**宏任务**，进入主线程
- 先遇到 `setTimeout` ， 等待 `4ms` 后，将其回调函数注入到**宏任务**`Event Queue`
- 接下来遇到 `todo1` 函数，没调用，就当看不到
- 调用 `todo1` 函数
- 遇到 `console.log('todo1-await-above')` 立即执行并输出
- 遇到 `await promise` ，相关于 `Promise.then`，将等待 `promise` 执行结束后再继续执行，这里将执行权交给`todo1`函数外部继续执行
- 遇到 `new Promise` 立即执行 `console.log('promise-1')` 并输出，之后执行 `resolve()`，接着将`then` 的回调函数注入到**微任务**`Event Queue`
- 遇到 `console.log('end')` ，立即执行并输出
- **注意**代码还有`console.log('todo1-await-under')`没有执行，在这里执行并放到**微任务**`Event Queue`【作者译：因为`await`后面跟着状态不确定的`promise`】
- 好了，整体代码`<script>`作为第一轮的宏任务执行结束，接下来按照先进先出原则，执行**微任务队列**事件。
- 执行并输出`promise-then-1`
- 执行并输出`todo1-await-under`
- 检查宏任务队列，这时还有`setTimeout`回调函数需要执行
- 执行并输出`setTimeout-1`
- 最后再次检查微任务队列，没有啦。再检查宏任务队列，也没啦
- 进入下一个事件循环

举例2：

```javascript
setTimeout(() => console.log('setTimeout-1'));

async function todo1(params) {
  console.log('todo1-await-above');
  // await Promise.resolve(99)
  await 123;
  console.log('todo1-await-under');
}

todo1();

new Promise((resolve, reject) => {
  console.log('promise-1');
  resolve();
}).then((data) => {
  console.log('promise-then-1');
});

console.log('end');

// todo1-await-above
// promise-1
// end
// todo1-await-under
// promise-then-1
// setTimeout-1
```

解析：

- 开启一个事件循环
- 老规矩，这段代码作为**宏任务**，进入主线程
- 先遇到 `setTimeout` ， 等待 `4ms` 后，将其回调函数注入到**宏任务**`Event Queue`
- 接下来遇到 `todo1` 函数，没调用，就当看不到
- 调用 `todo1` 函数
- 遇到 `console.log('todo1-await-above')` 立即执行并输出
- 遇到 `await 123` 因为这里 await 一个具体值，状态是明确的，所以继续向下执行，将`console.log('todo1-await-under')`放到**微任务 Event Queue**
- 遇到 `new Promise` 立即执行 `console.log('promise-1')` 并输出，之后执行 `resolve()`，将 `then` 的回调函数注入到**微任务**`Event Queue`
- 遇到 `console.log('end')` ，立即执行并输出
- 好了，整体代码`<script>`作为第一轮的宏任务执行结束，接下来按照先进先出原则，先执行**微任务队列**事件。
- 执行并输出`todo1-await-under`
- 执行并输出`promise-then-1`
- 检查宏任务队列，这时还有`setTimeout`回调函数需要执行
- 执行并输出`setTimeout-1`
- 最后再次检查微任务队列，没有啦。再检查宏任务队列，也没啦
- 进入下一个事件循环

例子来源：[https://github.com/gauseen/blog/issues/6](https://github.com/gauseen/blog/issues/6)

## JOJO 的奇妙比喻

银行上班时，为了控制人员密度，将门口排队的人放进银行，关上门，这是一轮**事件循环。**

进入银行的人去取号，等待柜员叫号，这个相当于**浏览器依次执行宏任务**。

有些人进入大厅后没有直接取号，而是先去找了大堂经理，相当于**异步任务，进入 Event Table**。问完了大堂经理，知道自己该取什么类型的号了，再去取号，相当于**执行完毕，进入 Event Queue**，等待叫号。

叫到号之后去办理业务相当于**主线程处理宏任务**。宏任务处理完毕后，柜员会询问是否还有其他需要办理的业务，这些任务无需重新取号，如果需要办理则相等于**添加微任务，此时会优先执行微任务。**

只有当一个人的所有业务办理完毕后，才会叫下一个人的号，相当于**执行下一个宏任务**。

宏任务依次执行直至大厅里所有人的业务全部办理完毕，这时银行会打开一次大门放进排队的人，开启**下一次事件循环**。

## 关联阅读

- [这一次，彻底弄懂 JavaScript 执行机制](https://juejin.cn/post/6844903512845860872)
- [微任务、宏任务与Event-Loop](https://juejin.cn/post/6844903657264136200)
