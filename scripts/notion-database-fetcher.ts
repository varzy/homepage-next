import fs from 'fs';
import path from 'path';
import { Client, isFullPage, type PageObjectResponse } from '@notionhq/client';
import { NotionImageProcessor } from '@zy/notion-images';
import { NotionToMarkdown } from 'notion-to-md';
import type { FetchResult, FetchState, SyncMetadata, SyncMode } from './types';
import { cleanupOrphanedFiles } from './utils';

type Query = Parameters<Client['dataSources']['query']>[0];
type PropertyFilter = Extract<NonNullable<Query['filter']>, { property: string }>;

/** 将一个 Notion 数据源同步到本地 Markdown 的配置。 */
interface NotionFetcherConfig<T extends SyncMetadata> {
  /** Notion 数据源 ID 的值，对应查询参数 `data_source_id`。 */
  databaseId: string | undefined;
  /** 本地 `content/` 下的目录名，也用于区分 R2 图片的来源。 */
  collection: string;
  /** 同步日志的标签，也是 `.fetch-state.json` 中的检查点键名。 */
  label: string;
  /** 追加到 Published 状态和增量时间条件的筛选规则。 */
  filters?: PropertyFilter[];
  /** 传给 Notion 查询的排序规则。 */
  sorts?: Query['sorts'];

  /** 从 Notion 页面提取同步和生成 Markdown 所需的元数据。 */
  extractMetadata(page: PageObjectResponse): T;
  /** 返回不含 `.md` 的文件名，用于定位文件和识别已下线内容。 */
  getFileKey(entry: T): string;
  /** 返回图片处理日志中的条目标识。返回空字符串时跳过正文图片处理。 */
  getConvertIdentifier(entry: T): string;
  /** 将元数据和已转换的正文拼成要写入磁盘的完整 Markdown。 */
  generateContent(entry: T, content: string): string;
}

export async function runNotionFetch<T extends SyncMetadata>(
  config: NotionFetcherConfig<T>,
): Promise<void> {
  try {
    const { databaseId, collection } = config;
    if (!databaseId) {
      throw new Error(`Missing Notion database ID for "${collection}"`);
    }

    const token = process.env.NOTION_API_SECRET;
    if (!token) {
      throw new Error('Missing required environment variable: NOTION_API_SECRET');
    }

    const mode: SyncMode = process.argv.includes('--force')
      ? 'force'
      : process.argv.includes('--full-sync')
        ? 'full-sync'
        : 'incremental';

    await new NotionDatabaseFetcher(config, databaseId, token).fetch(mode);
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exitCode = 1;
  }
}

class NotionDatabaseFetcher<T extends SyncMetadata> {
  private notion: Client;
  private markdown: NotionToMarkdown;
  private images: NotionImageProcessor;
  private outputDir: string;
  private stateFile = path.join(process.cwd(), '.fetch-state.json');

  constructor(
    private config: NotionFetcherConfig<T>,
    private databaseId: string,
    token: string,
  ) {
    this.notion = new Client({ auth: token });
    this.markdown = new NotionToMarkdown({ notionClient: this.notion });
    this.images = new NotionImageProcessor({
      notion: this.notion,
      label: config.collection,
    });
    this.outputDir = path.join(process.cwd(), 'content', config.collection);
  }

  async fetch(mode: SyncMode): Promise<void> {
    // Use the start time so edits arriving during this run are visible on the next one.
    const startedAt = new Date().toISOString();
    let since: Date | undefined;
    const existingState = this.readState()[this.config.label];

    if (mode === 'incremental') {
      if (!existingState?.lastSuccessfulRun) {
        console.log(
          `⚠️  No previous run state for "${this.config.label}", falling back to full-sync`,
        );
        mode = 'full-sync';
      } else {
        since = new Date(existingState.lastSuccessfulRun);
      }
    }

    console.log(
      `🚀 Starting to fetch ${this.config.label} [${mode}]${since ? ` since ${since.toISOString()}` : ''}...`,
    );

    const result: FetchResult = { updated: 0, errors: 0, deleted: 0 };
    fs.mkdirSync(this.outputDir, { recursive: true });

    const allEntries = await this.queryAllEntries(since);
    console.log(`📚 Found ${allEntries.length} published ${this.config.label} entries`);

    const toUpdate = this.filterToUpdate(allEntries, mode);
    console.log(`🔄 ${this.config.label} entries to update: ${toUpdate.length}`);

    for (const entry of toUpdate) {
      const label = this.config.getFileKey(entry) || entry.page_id;
      try {
        await this.processEntry(entry);
        result.updated++;
        console.log(`✅ Updated ${this.config.label}: ${label}`);
      } catch (error) {
        result.errors++;
        console.error(`❌ Failed to update ${this.config.label} ${label}:`, error);
      }
    }

    if (mode !== 'incremental') {
      const publishedIds = new Set(
        allEntries.map((e) => this.config.getFileKey(e)).filter(Boolean),
      );
      cleanupOrphanedFiles(this.outputDir, publishedIds, result);
    }

    console.log(
      `🎉 Done fetching ${this.config.label}! Updated: ${result.updated}, Deleted: ${result.deleted}, Skipped: ${allEntries.length - toUpdate.length}, Errors: ${result.errors}`,
    );

    if (result.errors === 0 && (result.updated > 0 || result.deleted > 0 || !existingState)) {
      this.writeState(mode, startedAt);
    }
  }

  private readState(): FetchState {
    try {
      return JSON.parse(fs.readFileSync(this.stateFile, 'utf-8')) ?? {};
    } catch {
      return {};
    }
  }

  private writeState(mode: SyncMode, startedAt: string): void {
    const state = this.readState();
    state[this.config.label] = {
      lastSuccessfulRun: startedAt,
      lastFullSync:
        mode === 'incremental' ? (state[this.config.label]?.lastFullSync ?? '') : startedAt,
    };
    fs.writeFileSync(this.stateFile, JSON.stringify(state, null, 2), 'utf-8');
    console.log(`💾 State saved for "${this.config.label}" [${mode}]`);
  }

  private async queryAllEntries(since?: Date): Promise<T[]> {
    const published: PropertyFilter = { property: 'status', select: { equals: 'Published' } };
    const filters = [published, ...(this.config.filters ?? [])];
    const filter: Query['filter'] = since
      ? {
          and: [
            ...filters,
            {
              timestamp: 'last_edited_time',
              last_edited_time: { on_or_after: since.toISOString() },
            },
          ],
        }
      : filters.length === 1
        ? published
        : { and: filters };
    const entries: T[] = [];
    let startCursor: string | undefined;

    do {
      const response = await this.notion.dataSources.query({
        data_source_id: this.databaseId,
        filter,
        sorts: this.config.sorts,
        start_cursor: startCursor,
      });

      for (const page of response.results) {
        if (!isFullPage(page)) throw new Error(`Incomplete Notion page: ${page.id}`);
        entries.push(this.config.extractMetadata(page));
      }
      startCursor = response.next_cursor || undefined;
    } while (startCursor);

    return entries;
  }

  private filterToUpdate(entries: T[], effectiveSyncMode: SyncMode): T[] {
    if (effectiveSyncMode === 'force') {
      console.log(`🔥 Force mode enabled - will update ALL ${this.config.label} entries`);
      return entries;
    }

    return entries.filter((entry) => {
      const fileKey = this.config.getFileKey(entry);
      const filePath = path.join(this.outputDir, `${fileKey}.md`);

      if (!fs.existsSync(filePath)) {
        console.log(`📥 New ${this.config.label}: ${fileKey}`);
        return true;
      }

      const lastFetchedTime = entry.last_fetched_time;
      if (!lastFetchedTime) {
        console.log(`🔄 First time fetch: ${fileKey}`);
        return true;
      }

      const needsUpdate = new Date(entry.last_edited_time) > new Date(lastFetchedTime);
      if (needsUpdate) {
        console.log(`🔄 Updated since last fetch: ${fileKey}`);
      }
      return needsUpdate;
    });
  }

  private async processEntry(entry: T): Promise<void> {
    const identifier = this.config.getConvertIdentifier(entry);
    const pageId = entry.page_id;

    // 处理 page property 中 files 类型的图片，上传到 R2 并更新 Notion
    const rawPage = await this.notion.pages.retrieve({ page_id: pageId });
    if (!isFullPage(rawPage)) throw new Error(`Incomplete Notion page: ${pageId}`);
    const updatedPage = await this.images.processPageFileProperties(rawPage);
    const updatedEntry = this.config.extractMetadata(updatedPage);

    if (identifier) {
      console.log(`🖼️ Processing images for ${identifier}...`);
      const { total, processed, skipped, errors } = await this.images.processPageImages(pageId);
      if (total > 0) {
        console.log(
          `📊 Images for ${identifier}: total=${total}, processed=${processed}, skipped=${skipped}, errors=${errors}`,
        );
      }
    }

    const blocks = await this.markdown.pageToMarkdown(pageId);
    const content = this.markdown.toMarkdownString(blocks).parent || '';
    const fetchedAt = new Date().toISOString();
    const mdContent = this.config.generateContent(
      { ...updatedEntry, last_fetched_time: fetchedAt },
      content,
    );
    const filePath = path.join(this.outputDir, `${this.config.getFileKey(entry)}.md`);
    fs.writeFileSync(filePath, mdContent, 'utf-8');

    await this.notion.pages.update({
      page_id: pageId,
      properties: { last_fetched_time: { date: { start: fetchedAt } } },
    });
    console.log(`📝 Updated last_fetched_time for page ${pageId}`);
  }
}
