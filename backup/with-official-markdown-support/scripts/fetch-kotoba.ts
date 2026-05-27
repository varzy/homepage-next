#!/usr/bin/env tsx

import 'dotenv/config';
import path from 'path';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionDatabaseFetcher, NotionFetcherConfig } from './notion-database-fetcher';
import { KotobaMetadata } from './types';
import {
  getTextProperty,
  getSelectProperty,
  getMultiSelectProperty,
  getUrlProperty,
  getCheckboxProperty,
  getDateProperty,
  getLastEditedTimeProperty,
} from './utils';

function extractKotobaMeta(page: PageObjectResponse): KotobaMetadata {
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
}

export function generateKotobaContent(meta: KotobaMetadata, content: string): string {
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
}

const kotobaConfig: NotionFetcherConfig<KotobaMetadata> = {
  databaseId: process.env.NOTION_KOTOBA_DATABASE_ID || '',
  notionApiSecret: process.env.NOTION_API_SECRET || '',
  outputDir: path.join(process.cwd(), 'content/kotoba'),
  lastFetchedTimeProperty: 'last_fetched_time',
  label: 'kotoba',
  imagePrefix: 'kotoba',
  buildFilter: () => ({
    and: [{ property: 'status', select: { equals: 'Published' } }],
  }),
  buildSort: () => [{ property: 'published_time', direction: 'descending' }],
  extractMetadata: extractKotobaMeta,
  getFileKey: (e) => `${e.published_time}-${e.page_id.split('-').pop()}`,
  getPageId: (e) => e.page_id,
  getConvertIdentifier: (e) => e.page_id.replace(/-/g, '').slice(0, 8),
  getLastFetchedTime: (e) => e.last_fetched_time,
  getLastEditedTime: (e) => e.last_edited_time,
  generateContent: generateKotobaContent,
  withLastFetchedTime: (e, t) => ({ ...e, last_fetched_time: t }),
};

async function main() {
  if (!kotobaConfig.databaseId || !kotobaConfig.notionApiSecret) {
    throw new Error(
      'Missing required environment variables: NOTION_KOTOBA_DATABASE_ID, NOTION_API_SECRET',
    );
  }

  if (!process.env.SMMS_API_TOKEN) {
    console.warn('⚠️ SMMS_API_TOKEN is not set — image upload will fail');
    process.exit(1);
  }

  const forceMode = process.argv.includes('--force');
  console.log(`🔥 Force mode: ${forceMode}`);

  await new NotionDatabaseFetcher(kotobaConfig, forceMode).fetch();
  process.exit(0);
}

main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
