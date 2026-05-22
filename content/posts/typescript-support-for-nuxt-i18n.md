---
title: 'Nuxt I18n 支持类型推导'
category: 'Coding'
type: 'Post'
status: 'Published'
tags: ['Nuxt']
date: '2025-09-03'
slug: 'typescript-support-for-nuxt-i18n'
summary: ''
last_edited_time: '2025-09-03T08:26:00.000Z'
last_fetched_time: '2025-09-03T08:32:13.629Z'
page_id: '263dc9c0-364a-80aa-b2ac-e71835a1ec39'
icon: '🩰'
---

Nuxt I18n 本质上是对 Vue I18n 的封装，而 Vue I18n 是支持 TypeScript 类型推导的，详见 [TypeScript Support](https://vue-i18n.intlify.dev/guide/advanced/typescript)。很可惜 Nuxt I18n 并不能在配置文件中传入类型。

```typescript
// app/locales/i18n.config.ts
export type MessageSchema = typeof en; // 🥲 没地方传入啊？？？

export default defineI18nConfig(() => ({
  legacy: false,
  fallbackLocale: 'en',
  messages: {
    en: en,
    'zh-CN': zhCn,
  },
}));
```

这导致我们在调用时无法获知键值。解决方案也很简单，即对 useI118n 调用层进行进一步封装，后续所有的 `t` 方法都使用此 composable。

```typescript
// app/composables/useEsayI18n.ts
import { useI18n } from 'vue-i18n';
import type { MessageSchema } from '~/locales/i18n.config';

export default function () {
  const i18nFns = useI18n<{ message: MessageSchema }>(); // ✅ 在这里传入类型
  return { ...i18nFns };
}
```

Before:

![RYIj2hLODyxeU4K.png](https://cdn.sa.net/2025/09/03/RYIj2hLODyxeU4K.png)

After:

![bkqPdySfjaROr9l.png](https://cdn.sa.net/2025/09/03/bkqPdySfjaROr9l.png)
