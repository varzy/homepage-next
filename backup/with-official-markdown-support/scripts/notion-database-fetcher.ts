import fs from 'fs';
import path from 'path';
import { Client } from '@notionhq/client';
import { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { NotionToMDXConverter } from './notion-to-md';
import { FetchResult } from './types';
import { ensureDirectory, cleanupOrphanedFiles } from './utils';

export interface NotionFetcherConfig<T> {
  databaseId: string;
  notionApiSecret: string;
  outputDir: string;
  /** Notion 中记录本次抓取时间的属性名，如 last_fetched_time 或 last_fetched_time */
  lastFetchedTimeProperty: string;
  /** 日志标签，如 "post"、"page"、"kotoba" */
  label: string;
  /** SMMS 图片文件名前缀，如 "posts"、"pages"、"kotoba" */
  imagePrefix: string;

  buildFilter(): object;
  buildSort(): object[];

  extractMetadata(page: PageObjectResponse): T;
  /** 本地文件名（不含 .md），如 slug 或 page_id */
  getFileKey(entry: T): string;
  getPageId(entry: T): string;
  /** 传给 convertToMDX 的标识符 */
  getConvertIdentifier(entry: T): string;
  getLastFetchedTime(entry: T): string | null;
  getLastEditedTime(entry: T): string;
  generateContent(entry: T, content: string): string;
  withLastFetchedTime(entry: T, time: string): T;
}

export class NotionDatabaseFetcher<T> {
  private notion: Client;
  private converter: NotionToMDXConverter;

  constructor(
    private config: NotionFetcherConfig<T>,
    private forceMode: boolean,
  ) {
    this.notion = new Client({ auth: config.notionApiSecret });
    this.converter = new NotionToMDXConverter(config.notionApiSecret, config.imagePrefix);
  }

  async fetch(): Promise<FetchResult> {
    console.log(
      `🚀 Starting to fetch ${this.config.label}${this.forceMode ? ' (FORCE MODE)' : ''}...`,
    );

    const result: FetchResult = { updated: 0, skipped: 0, errors: 0, deleted: 0 };

    ensureDirectory(this.config.outputDir);

    const allEntries = await this.queryAllEntries();
    console.log(`📚 Found ${allEntries.length} published ${this.config.label} entries`);

    const publishedIds = new Set(allEntries.map((e) => this.config.getFileKey(e)).filter(Boolean));
    const toUpdate = this.filterToUpdate(allEntries);
    console.log(`🔄 ${this.config.label} entries to update: ${toUpdate.length}`);

    if (toUpdate.length === 0 && !this.forceMode) {
      cleanupOrphanedFiles(this.config.outputDir, publishedIds, result);
      console.log(`✅ All ${this.config.label} entries are up to date!`);
      return result;
    }

    for (const entry of toUpdate) {
      const label = this.config.getFileKey(entry) || this.config.getPageId(entry);
      try {
        await this.processEntry(entry);
        result.updated++;
        console.log(`✅ Updated ${this.config.label}: ${label}`);
      } catch (error) {
        result.errors++;
        console.error(`❌ Failed to update ${this.config.label} ${label}:`, error);
      }
    }

    cleanupOrphanedFiles(this.config.outputDir, publishedIds, result);

    console.log(
      `🎉 Done fetching ${this.config.label}! Updated: ${result.updated}, Deleted: ${result.deleted}, Skipped: ${result.skipped}, Errors: ${result.errors}`,
    );

    return result;
  }

  private async queryAllEntries(): Promise<T[]> {
    const entries: T[] = [];
    let startCursor: string | undefined;

    do {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (this.notion as any).dataSources.query({
        data_source_id: this.config.databaseId,
        filter: this.config.buildFilter(),
        sorts: this.config.buildSort(),
        start_cursor: startCursor,
      });

      const pageEntries = response.results.map((page: PageObjectResponse) =>
        this.config.extractMetadata(page),
      );
      entries.push(...pageEntries);
      startCursor = response.next_cursor || undefined;
    } while (startCursor);

    return entries;
  }

  private filterToUpdate(entries: T[]): T[] {
    if (this.forceMode) {
      console.log(`🔥 Force mode enabled - will update ALL ${this.config.label} entries`);
      return entries;
    }

    return entries.filter((entry) => {
      const filePath = path.join(this.config.outputDir, `${this.config.getFileKey(entry)}.md`);

      if (!fs.existsSync(filePath)) {
        console.log(`📥 New ${this.config.label}: ${this.config.getFileKey(entry)}`);
        return true;
      }

      const lastFetchedTime = this.config.getLastFetchedTime(entry);
      if (!lastFetchedTime) {
        console.log(`🔄 First time fetch: ${this.config.getFileKey(entry)}`);
        return true;
      }

      const needsUpdate =
        new Date(this.config.getLastEditedTime(entry)) > new Date(lastFetchedTime);
      if (needsUpdate) {
        console.log(`🔄 Updated since last fetch: ${this.config.getFileKey(entry)}`);
      }
      return needsUpdate;
    });
  }

  private async processEntry(entry: T): Promise<void> {
    const identifier = this.config.getConvertIdentifier(entry);
    const pageId = this.config.getPageId(entry);

    const { content, imageStats } = await this.converter.convertToMDX(pageId, identifier);

    if (imageStats && imageStats.total > 0) {
      console.log(
        `📊 Images for ${identifier}: total=${imageStats.total}, processed=${imageStats.processed}, skipped=${imageStats.skipped}, errors=${imageStats.errors}`,
      );
    }

    await this.converter.updateBlogLastFetchedTime(pageId, this.config.lastFetchedTimeProperty);

    const updatedEntry = this.config.withLastFetchedTime(entry, new Date().toISOString());
    const mdContent = this.config.generateContent(updatedEntry, content);

    const filePath = path.join(this.config.outputDir, `${this.config.getFileKey(entry)}.md`);
    fs.writeFileSync(filePath, mdContent, 'utf-8');
  }
}
