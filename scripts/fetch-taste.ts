#!/usr/bin/env tsx

import 'dotenv/config';
import { runNotionFetch } from './notion-database-fetcher';
import type { TasteMetadata } from './types';
import {
  getTextProperty,
  getSelectProperty,
  getUrlProperty,
  getFilesProperty,
  getLastEditedTimeProperty,
  getDateProperty,
} from './utils';

void runNotionFetch<TasteMetadata>({
  databaseId: process.env.NOTION_TASTE_DATABASE_ID,
  collection: 'taste',
  label: 'taste',
  sorts: [{ property: 'category', direction: 'ascending' }],
  extractMetadata(page) {
    const p = page.properties;
    return {
      page_id: page.id,
      title: getTextProperty(p.title),
      alias: getTextProperty(p.alias),
      status: getSelectProperty(p.status),
      category: getSelectProperty(p.category),
      cover: getFilesProperty(p.cover),
      url: getUrlProperty(p.url) || undefined,
      label: getTextProperty(p.label) || undefined,
      last_edited_time: getLastEditedTimeProperty(p.last_edited_time),
      last_fetched_time: getDateProperty(p.last_fetched_time) || null,
    };
  },
  getFileKey: (e) => e.page_id,
  getConvertIdentifier: (e) => e.page_id.replace(/-/g, '').slice(0, 8),
  generateContent(meta, content) {
    return `---
page_id: "${meta.page_id}"
title: "${meta.title.replace(/"/g, '\\"')}"
alias: "${meta.alias}"
status: "${meta.status}"
category: "${meta.category}"
cover: "${meta.cover}"
url: "${meta.url || ''}"
label: "${meta.label || ''}"
last_edited_time: "${meta.last_edited_time}"
last_fetched_time: "${meta.last_fetched_time || ''}"
---

${content}`;
  },
});
