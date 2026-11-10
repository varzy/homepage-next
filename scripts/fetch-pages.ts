#!/usr/bin/env tsx

import 'dotenv/config';
import { runNotionFetch } from './notion-database-fetcher';
import type { PageMetadata } from './types';
import {
  getTextProperty,
  getSelectProperty,
  getLastEditedTimeProperty,
  getDateProperty,
} from './utils';

void runNotionFetch<PageMetadata>({
  databaseId: process.env.NOTION_PAGES_DATABASE_ID,
  collection: 'pages',
  label: 'page',
  extractMetadata(page) {
    const p = page.properties;
    return {
      page_id: page.id,
      title: getTextProperty(p.title),
      slug: getTextProperty(p.slug),
      status: getSelectProperty(p.status),
      last_edited_time: getLastEditedTimeProperty(p.last_edited_time),
      last_fetched_time: getDateProperty(p.last_fetched_time) || null,
    };
  },
  getFileKey: (e) => e.slug,
  getConvertIdentifier: (e) => e.slug,
  generateContent(meta, content) {
    return `---
page_id: "${meta.page_id}"
title: "${meta.title.replace(/"/g, '\\"')}"
slug: "${meta.slug}"
status: "${meta.status}"
last_edited_time: "${meta.last_edited_time}"
last_fetched_time: "${meta.last_fetched_time || ''}"
---

${content}`;
  },
});
