#!/usr/bin/env tsx

import 'dotenv/config';
import { runNotionFetch } from './notion-database-fetcher';
import type { PostMetadata } from './types';
import {
  getTextProperty,
  getSelectProperty,
  getMultiSelectProperty,
  getDateProperty,
} from './utils';

void runNotionFetch<PostMetadata>({
  databaseId: process.env.NOTION_POSTS_DATABASE_ID,
  collection: 'posts',
  label: 'post',
  filters: [{ property: 'type', select: { equals: 'Post' } }],
  sorts: [{ property: 'date', direction: 'descending' }],
  extractMetadata(page) {
    const properties = page.properties;
    const icon = page.icon?.type === 'emoji' ? (page.icon.emoji as string) : undefined;
    return {
      page_id: page.id,
      title: getTextProperty(properties.title),
      category: getSelectProperty(properties.category),
      type: getSelectProperty(properties.type),
      status: getSelectProperty(properties.status),
      tags: getMultiSelectProperty(properties.tags),
      date: getDateProperty(properties.date),
      slug: getTextProperty(properties.slug),
      summary: getTextProperty(properties.summary),
      last_edited_time: page.last_edited_time,
      last_fetched_time: getDateProperty(properties.last_fetched_time),
      icon,
    };
  },
  getFileKey: (e) => e.slug,
  getConvertIdentifier: (e) => e.slug,
  generateContent(metadata, content) {
    return `---
title: "${metadata.title.replace(/"/g, '\\"')}"
category: "${metadata.category}"
type: "${metadata.type}"
status: "${metadata.status}"
tags: [${metadata.tags.map((tag) => `"${tag}"`).join(', ')}]
date: "${metadata.date}"
slug: "${metadata.slug}"
summary: "${metadata.summary.replace(/"/g, '\\"')}"
last_edited_time: "${metadata.last_edited_time}"
last_fetched_time: "${metadata.last_fetched_time || ''}"
page_id: "${metadata.page_id}"${metadata.icon ? `\nicon: "${metadata.icon}"` : ''}
---

${content}`;
  },
});
