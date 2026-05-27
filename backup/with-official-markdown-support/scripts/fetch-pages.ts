#!/usr/bin/env tsx

import 'dotenv/config';
import path from 'path';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionDatabaseFetcher, NotionFetcherConfig } from './notion-database-fetcher';
import { PageMetadata } from './types';
import {
  getTextProperty,
  getSelectProperty,
  getLastEditedTimeProperty,
  getDateProperty,
} from './utils';

function extractPageMeta(page: PageObjectResponse): PageMetadata {
  const p = page.properties;
  return {
    page_id: page.id,
    title: getTextProperty(p.title),
    slug: getTextProperty(p.slug),
    status: getSelectProperty(p.status),
    last_edited_time: getLastEditedTimeProperty(p.last_edited_time),
    last_fetched_time: getDateProperty(p.last_fetched_time) || null,
  };
}

export function generatePageContent(meta: PageMetadata, content: string): string {
  return `---
page_id: "${meta.page_id}"
title: "${meta.title.replace(/"/g, '\\"')}"
slug: "${meta.slug}"
status: "${meta.status}"
last_edited_time: "${meta.last_edited_time}"
last_fetched_time: "${meta.last_fetched_time || ''}"
---

${content}`;
}

const pagesConfig: NotionFetcherConfig<PageMetadata> = {
  databaseId: process.env.NOTION_PAGES_DATABASE_ID || '',
  notionApiSecret: process.env.NOTION_API_SECRET || '',
  outputDir: path.join(process.cwd(), 'content/pages'),
  lastFetchedTimeProperty: 'last_fetched_time',
  label: 'page',
  imagePrefix: 'pages',
  buildFilter: () => ({ property: 'status', select: { equals: 'Published' } }),
  buildSort: () => [],
  extractMetadata: extractPageMeta,
  getFileKey: (e) => e.slug,
  getPageId: (e) => e.page_id,
  getConvertIdentifier: (e) => e.slug,
  getLastFetchedTime: (e) => e.last_fetched_time,
  getLastEditedTime: (e) => e.last_edited_time,
  generateContent: generatePageContent,
  withLastFetchedTime: (e, t) => ({ ...e, last_fetched_time: t }),
};

async function main() {
  if (!pagesConfig.databaseId || !pagesConfig.notionApiSecret) {
    throw new Error(
      'Missing required environment variables: NOTION_PAGES_DATABASE_ID, NOTION_API_SECRET',
    );
  }

  if (!process.env.SMMS_API_TOKEN) {
    console.warn('⚠️ SMMS_API_TOKEN is not set — image upload will fail');
    process.exit(1);
  }

  const forceMode = process.argv.includes('--force');
  console.log(`🔥 Force mode: ${forceMode}`);

  await new NotionDatabaseFetcher(pagesConfig, forceMode).fetch();
  process.exit(0);
}

main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
