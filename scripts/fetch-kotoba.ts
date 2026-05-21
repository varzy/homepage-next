#!/usr/bin/env tsx

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionToMDXConverter } from './notion-to-md';
import { KotobaMetadata, FetchResult } from './types';

// ─── Notion property helpers ──────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getTextProperty = (prop: any): string => {
  if (!prop) return '';
  if (prop.type === 'title') return prop.title.map((t: any) => t.plain_text).join('');
  if (prop.type === 'rich_text') return prop.rich_text.map((t: any) => t.plain_text).join('');
  return '';
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSelectProperty = (prop: any): string => prop?.select?.name || '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getMultiSelectProperty = (prop: any): string[] =>
  prop?.multi_select?.map((item: any) => item.name) || [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getUrlProperty = (prop: any): string => prop?.url || '';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getCheckboxProperty = (prop: any): boolean => prop?.checkbox ?? false;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getDateProperty = (prop: any): string => prop?.date?.start || '';

// ─── Frontmatter generator ────────────────────────────────────────────────────

function generateKotobaContent(meta: KotobaMetadata, content: string): string {
  return `---
page_id: "${meta.page_id}"
title: "${meta.title.replace(/"/g, '\\"')}"
status: "${meta.status}"
tags: [${meta.tags.map((tag) => `"${tag}"`).join(', ')}]
title_url: "${meta.title_url}"
with_title: ${meta.with_title}
published_date: "${meta.published_date}"
last_edited_time: "${meta.last_edited_time}"
blog_last_fetched_time: "${meta.blog_last_fetched_time || ''}"
---

${content}`;
}

// ─── KotobaFetcher ────────────────────────────────────────────────────────────

class KotobaFetcher {
  private notion: Client;
  private converter: NotionToMDXConverter;
  private databaseId: string;
  private outputDir: string;
  private forceMode: boolean;

  constructor(forceMode = false) {
    const notionApiSecret = process.env.NOTION_KOTOBA_API_SECRET || '';
    this.databaseId = process.env.NOTION_KOTOBA_DATABASE_ID || '';

    if (!this.databaseId || !notionApiSecret) {
      throw new Error(
        'Missing required environment variables: NOTION_KOTOBA_DATABASE_ID, NOTION_KOTOBA_API_SECRET',
      );
    }

    this.notion = new Client({ auth: notionApiSecret });
    this.converter = new NotionToMDXConverter(notionApiSecret);
    this.outputDir = path.join(process.cwd(), 'content/kotoba');
    this.forceMode = forceMode;
  }

  async fetch(): Promise<FetchResult> {
    console.log(
      `🚀 Starting to fetch kotoba posts${this.forceMode ? ' (FORCE MODE)' : ''}...`,
    );

    const result: FetchResult = { updated: 0, skipped: 0, errors: 0, deleted: 0 };

    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      console.log(`📁 Created directory: ${this.outputDir}`);
    }

    const allEntries = await this.getAllEntries();
    console.log(`📚 Found ${allEntries.length} published kotoba posts`);

    const publishedIds = new Set(allEntries.map((e) => e.page_id));
    const toUpdate = this.filterEntriesToUpdate(allEntries);
    console.log(`🔄 Posts to update: ${toUpdate.length}`);

    if (toUpdate.length === 0 && !this.forceMode) {
      this.cleanupOrphanedFiles(publishedIds, result);
      console.log('✅ All kotoba posts are up to date!');
      return result;
    }

    for (const entry of toUpdate) {
      try {
        await this.processEntry(entry);
        result.updated++;
        console.log(`✅ Updated: ${entry.title || entry.page_id}`);
      } catch (error) {
        result.errors++;
        console.error(`❌ Failed to update ${entry.title || entry.page_id}:`, error);
      }
    }

    this.cleanupOrphanedFiles(publishedIds, result);

    console.log(
      `🎉 Done! Updated: ${result.updated}, Deleted: ${result.deleted}, Skipped: ${result.skipped}, Errors: ${result.errors}`,
    );

    return result;
  }

  private async getAllEntries(): Promise<KotobaMetadata[]> {
    const entries: KotobaMetadata[] = [];
    let startCursor: string | undefined;

    do {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (this.notion as any).dataSources.query({
        data_source_id: this.databaseId,
        filter: {
          property: 'Status',
          select: { equals: 'Published' },
        },
        sorts: [{ property: 'PublishedDate', direction: 'descending' }],
        start_cursor: startCursor,
      });

      const pageEntries = response.results.map((page: PageObjectResponse) =>
        this.extractKotobaMeta(page),
      );
      entries.push(...pageEntries);
      startCursor = response.next_cursor || undefined;
    } while (startCursor);

    return entries;
  }

  private extractKotobaMeta(page: PageObjectResponse): KotobaMetadata {
    const p = page.properties;
    return {
      page_id: page.id,
      title: getTextProperty(p.Name),
      status: getSelectProperty(p.Status),
      tags: getMultiSelectProperty(p.Tags),
      title_url: getUrlProperty(p.TitleURL),
      with_title: getCheckboxProperty(p.WithTitle),
      published_date: getDateProperty(p.PublishedDate),
      last_edited_time: page.last_edited_time,
      blog_last_fetched_time: getDateProperty(p.blog_last_fetched_time) || null,
    };
  }

  private filterEntriesToUpdate(entries: KotobaMetadata[]): KotobaMetadata[] {
    if (this.forceMode) return entries;

    return entries.filter((entry) => {
      const filePath = this.filePath(entry.page_id);
      if (!fs.existsSync(filePath)) {
        console.log(`📥 New post: ${entry.title || entry.page_id}`);
        return true;
      }
      if (!entry.blog_last_fetched_time) {
        console.log(`🔄 First time fetch: ${entry.title || entry.page_id}`);
        return true;
      }
      const needsUpdate = new Date(entry.last_edited_time) > new Date(entry.blog_last_fetched_time);
      if (needsUpdate) {
        console.log(`🔄 Updated since last fetch: ${entry.title || entry.page_id}`);
      }
      return needsUpdate;
    });
  }

  private async processEntry(entry: KotobaMetadata): Promise<void> {
    const identifier = `kotoba_${entry.page_id.replace(/-/g, '').slice(0, 8)}`;

    const { content, imageStats } = await this.converter.convertToMDX(entry.page_id, identifier);

    if (imageStats && imageStats.total > 0) {
      console.log(
        `📊 Images for ${identifier}: total=${imageStats.total}, processed=${imageStats.processed}, skipped=${imageStats.skipped}, errors=${imageStats.errors}`,
      );
    }

    await this.converter.updateBlogLastFetchedTime(entry.page_id);

    const updatedEntry: KotobaMetadata = {
      ...entry,
      blog_last_fetched_time: new Date().toISOString(),
    };

    const mdContent = generateKotobaContent(updatedEntry, content);
    fs.writeFileSync(this.filePath(entry.page_id), mdContent, 'utf-8');
  }

  private cleanupOrphanedFiles(publishedIds: Set<string>, result: FetchResult): void {
    try {
      const files = fs.readdirSync(this.outputDir);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        const pageId = file.replace(/\.md$/, '');
        if (!publishedIds.has(pageId)) {
          try {
            fs.unlinkSync(path.join(this.outputDir, file));
            result.deleted++;
            console.log(`🗑️ Deleted orphaned file: ${file}`);
          } catch (err) {
            result.errors++;
            console.error(`❌ Failed to delete orphaned file ${file}:`, err);
          }
        }
      }
    } catch (err) {
      result.errors++;
      console.error('❌ Failed during orphaned files cleanup:', err);
    }
  }

  private filePath(pageId: string): string {
    return path.join(this.outputDir, `${pageId}.md`);
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.SMMS_API_TOKEN) {
    console.warn('⚠️ SMMS_API_TOKEN is not set — image upload will fail');
    process.exit(1);
  }

  const forceMode = process.argv.includes('--force');
  console.log(`🔥 Force mode: ${forceMode}`);

  const fetcher = new KotobaFetcher(forceMode);
  await fetcher.fetch();
  process.exit(0);
}

main().catch((error) => {
  console.error('💥 Script failed:', error);
  process.exit(1);
});
