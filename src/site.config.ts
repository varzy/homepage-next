export const SITE_CONFIG = {
  title: `贼歪`,
  keywords: `贼歪, zy, 个人网站, 博客, 技术, 前端, Notion, Homepage, Blog`,
  description: `Hi, 我是贼歪。Web 开发者，写字的人，INFJ。`,
  author: `贼歪`,
  lang: `zh-CN`,
  siteUrl: `https://varzy.me`, // RSS 需要的网站 URL
  feedPath: `/rss.xml`, // RSS 订阅路径
  blogPerPage: 10,
  categories: {
    nichijou: {
      notionField: 'Nichijou',
      alias: '日常',
      favicon: '🍀',
      description: '一个普通人的思考与呓语。',
    },
    coding: {
      notionField: 'Coding',
      alias: '编程',
      favicon: '🧑‍💻',
      description: '一堆没有干货的技术笔记。',
    },
  },
};
