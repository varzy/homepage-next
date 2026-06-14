#!/usr/bin/env tsx

import 'dotenv/config';
import path from 'path';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionDatabaseFetcher, NotionFetcherConfig } from './notion-database-fetcher';
import { PostMetadata, SyncMode } from './types';
import {
  getTextProperty,
  getSelectProperty,
  getMultiSelectProperty,
  getDateProperty,
} from './utils';

function extractPostMeta(page: PageObjectResponse): PostMetadata {
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
}

export function generateMDXContent(metadata: PostMetadata, content: string): string {
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
}

const postConfig: NotionFetcherConfig<PostMetadata> = {
  databaseId: process.env.NOTION_POSTS_DATABASE_ID || '',
  notionApiSecret: process.env.NOTION_API_SECRET || '',
  outputDir: path.join(process.cwd(), 'content/posts'),
  label: 'post',
  imagePrefix: 'posts',
  lastFetchedTimeProperty: 'last_fetched_time',
  buildFilter: (since?: Date) => ({
    and: [
      { property: 'status', select: { equals: 'Published' } },
      { property: 'type', select: { equals: 'Post' } },
      ...(since
        ? [{ timestamp: 'last_edited_time', last_edited_time: { on_or_after: since.toISOString() } }]
        : []),
    ],
  }),
  buildSort: () => [{ property: 'date', direction: 'descending' }],
  extractMetadata: extractPostMeta,
  getFileKey: (e) => e.slug,
  getPageId: (e) => e.page_id,
  getConvertIdentifier: (e) => e.slug,
  getLastFetchedTime: (e) => e.last_fetched_time,
  getLastEditedTime: (e) => e.last_edited_time,
  generateContent: generateMDXContent,
  withLastFetchedTime: (e, t) => ({ ...e, last_fetched_time: t }),
};

async function main() {
  if (!postConfig.databaseId || !postConfig.notionApiSecret) {
    throw new Error(
      'Missing required environment variables: NOTION_POSTS_DATABASE_ID, NOTION_API_SECRET',
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

  await new NotionDatabaseFetcher(postConfig, syncMode).fetch();
  process.exit(0);
}

main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
