export const SITE_CONFIG = {
  isProd: (process.env.VERCEL_ENV || process.env.NODE_ENV) === 'production',
  notionDatabaseId: process.env.NOTION_DATABASE_ID || '',
  notionApiSecret: process.env.NOTION_API_SECRET || '',

  title: `贼歪`,
  keywords: `贼歪, zy, 个人网站, 博客, 技术, 前端, Notion, Homepage, Blog`,
  description: ``,
  author: `zy`,
  email: ``,
  lang: `zh-CN`,

  blogPerPage: 10,
  // key: /categories/{key}
  // notionField: Filed name in notion database.
  categories: {
    nichijou: { notionField: 'Nichijou', alias: '日常', description: '一个普通人的思考与呓语。' },
    tech: { notionField: 'Tech', alias: '技术', description: '一堆没有干货的技术笔记。' },
  },
};
