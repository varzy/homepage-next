# TODO

1. 拆分 posts-loader 和 pages-loader
2. 更新日期显示方式，添加公共方法用于格式化时间，不在 content-loader 层做这件事
3. PostMeta 添加 categoryAlias 和 categoryKey 两个字段
4. 移除 dateAmericaStyle 字段，改为一个 utils/date.ts 中的一个公共方法，用来格式化输出
5. Archive 页面添加按年份分组
