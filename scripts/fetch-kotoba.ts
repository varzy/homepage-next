#!/usr/bin/env tsx

import 'dotenv/config';
import { runNotionFetch } from './notion-database-fetcher';
import type { KotobaMetadata } from './types';
import {
  getTextProperty,
  getSelectProperty,
  getMultiSelectProperty,
  getUrlProperty,
  getCheckboxProperty,
  getDateProperty,
  getLastEditedTimeProperty,
} from './utils';

void runNotionFetch<KotobaMetadata>({
  databaseId: process.env.NOTION_KOTOBA_DATABASE_ID,
  collection: 'kotoba',
  label: 'kotoba',
  sorts: [{ property: 'published_time', direction: 'descending' }],
  extractMetadata(page) {
    const p = page.properties;
    return {
      page_id: page.id,
      title: getTextProperty(p.title),
      status: getSelectProperty(p.status),
      tags: getMultiSelectProperty(p.tags),
      title_url: getUrlProperty(p.title_url),
      with_title: getCheckboxProperty(p.with_title),
      published_time: getDateProperty(p.published_time),
      last_edited_time: getLastEditedTimeProperty(p.last_edited_time),
      last_fetched_time: getDateProperty(p.last_fetched_time) || null,
    };
  },
  getFileKey: (e) => `${e.published_time.slice(0, 10)}-${e.page_id.split('-').pop()}`,
  getConvertIdentifier: (e) => e.page_id.replace(/-/g, '').slice(0, 8),
  generateContent(meta, content) {
    return `---
page_id: "${meta.page_id}"
title: "${meta.title.replace(/"/g, '\\"')}"
status: "${meta.status}"
tags: [${meta.tags.map((tag) => `"${tag}"`).join(', ')}]
title_url: "${meta.title_url}"
with_title: ${meta.with_title}
published_time: "${meta.published_time}"
last_edited_time: "${meta.last_edited_time}"
last_fetched_time: "${meta.last_fetched_time || ''}"
---

${content}`;
  },
});
