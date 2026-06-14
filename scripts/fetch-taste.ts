#!/usr/bin/env tsx

import 'dotenv/config';
import path from 'path';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionDatabaseFetcher, NotionFetcherConfig } from './notion-database-fetcher';
import { TasteMetadata, SyncMode } from './types';
import {
  getTextProperty,
  getSelectProperty,
  getUrlProperty,
  getFilesProperty,
  getLastEditedTimeProperty,
  getDateProperty,
} from './utils';

function extractTasteMeta(page: PageObjectResponse): TasteMetadata {
  const p = page.properties;
  return {
    page_id: page.id,
    title: getTextProperty(p.title),
    status: getSelectProperty(p.status),
    category: getSelectProperty(p.category),
    cover: getFilesProperty(p.cover),
    url: getUrlProperty(p.url) || undefined,
    label: getTextProperty(p.label) || undefined,
    last_edited_time: getLastEditedTimeProperty(p.last_edited_time),
    last_fetched_time: getDateProperty(p.last_fetched_time) || null,
  };
}

export function generateTasteContent(meta: TasteMetadata, content: string): string {
  return `---
page_id: "${meta.page_id}"
title: "${meta.title.replace(/"/g, '\\"')}"
status: "${meta.status}"
category: "${meta.category}"
cover: "${meta.cover}"
url: "${meta.url || ''}"
label: "${meta.label || ''}"
last_edited_time: "${meta.last_edited_time}"
last_fetched_time: "${meta.last_fetched_time || ''}"
---

${content}`;
}

const tasteConfig: NotionFetcherConfig<TasteMetadata> = {
  databaseId: process.env.NOTION_TASTE_DATABASE_ID || '',
  notionApiSecret: process.env.NOTION_API_SECRET || '',
  outputDir: path.join(process.cwd(), 'content/taste'),
  lastFetchedTimeProperty: 'last_fetched_time',
  label: 'taste',
  imagePrefix: 'taste',
  buildFilter: (since?: Date) => ({
    and: [
      { property: 'status', select: { equals: 'Published' } },
      ...(since
        ? [{ timestamp: 'last_edited_time', last_edited_time: { on_or_after: since.toISOString() } }]
        : []),
    ],
  }),
  buildSort: () => [{ property: 'category', direction: 'ascending' }],
  extractMetadata: extractTasteMeta,
  getFileKey: (e) => e.page_id,
  getPageId: (e) => e.page_id,
  getConvertIdentifier: (e) => e.page_id.replace(/-/g, '').slice(0, 8),
  getLastFetchedTime: (e) => e.last_fetched_time,
  getLastEditedTime: (e) => e.last_edited_time,
  generateContent: generateTasteContent,
  withLastFetchedTime: (e, t) => ({ ...e, last_fetched_time: t }),
};

async function main() {
  if (!tasteConfig.databaseId || !tasteConfig.notionApiSecret) {
    throw new Error(
      'Missing required environment variables: NOTION_TASTE_DATABASE_ID, NOTION_API_SECRET',
    );
  }

  if (!process.env.SMMS_API_TOKEN) {
    console.warn('⚠️ SMMS_API_TOKEN is not set — image upload will fail');
    process.exit(1);
  }

  const syncMode: SyncMode = process.argv.includes('--force')
    ? 'force'
    : process.argv.includes('--full-sync')
      ? 'full-sync'
      : 'incremental';

  await new NotionDatabaseFetcher(tasteConfig, syncMode).fetch();
  process.exit(0);
}

main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
