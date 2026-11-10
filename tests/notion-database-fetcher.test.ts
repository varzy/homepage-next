import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runNotionFetch } from '../scripts/notion-database-fetcher';

const { query, retrieve, update } = vi.hoisted(() => ({
  query: vi.fn(),
  retrieve: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@notionhq/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@notionhq/client')>()),
  Client: class {
    dataSources = { query };
    pages = { retrieve, update };
  },
}));

vi.mock('@zy/notion-images', () => ({
  NotionImageProcessor: class {
    async processPageFileProperties(page: unknown) {
      return page;
    }
    async processPageImages() {
      return { total: 0, processed: 0, skipped: 0, errors: 0 };
    }
  },
}));

vi.mock('notion-to-md', () => ({
  NotionToMarkdown: class {
    async pageToMarkdown() {
      return [];
    }
    toMarkdownString() {
      return { parent: 'Synced body' };
    }
  },
}));

const startedAt = '2026-10-01T01:00:00.000Z';
const previousRun = '2026-09-30T01:00:00.000Z';
const postFilter = { property: 'type', select: { equals: 'Post' } };
const published = { property: 'status', select: { equals: 'Published' } };

const run = () =>
  runNotionFetch({
    databaseId: 'test-source',
    collection: 'posts',
    label: 'post',
    filters: [postFilter],
    sorts: [{ property: 'date', direction: 'descending' }],
    extractMetadata: (page) => ({
      page_id: page.id,
      last_edited_time: page.last_edited_time,
      last_fetched_time: null,
    }),
    getFileKey: (entry) => entry.page_id,
    getConvertIdentifier: (entry) => entry.page_id,
    generateContent: (entry, content) => `${entry.last_fetched_time}\n${content}`,
  });

const page = (id: string) => ({
  object: 'page',
  url: 'https://example.com',
  id,
  last_edited_time: startedAt,
});

describe('Notion content sync', () => {
  let dir: string;
  let postsDir: string;
  let stateFile: string;
  const argv = process.argv;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(startedAt);
    vi.stubEnv('NOTION_API_SECRET', 'test-token');
    process.argv = ['node', 'fetch-posts.ts'];
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'homepage-sync-'));
    postsDir = path.join(dir, 'content', 'posts');
    stateFile = path.join(dir, '.fetch-state.json');
    fs.mkdirSync(postsDir, { recursive: true });
    vi.spyOn(process, 'cwd').mockReturnValue(dir);
    retrieve.mockImplementation(async ({ page_id }) => page(page_id));
    fs.writeFileSync(path.join(postsDir, 'existing.md'), 'existing');
  });

  afterEach(() => {
    process.argv = argv;
    vi.restoreAllMocks();
    vi.useRealTimers();
    vi.unstubAllEnvs();
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('paginates a first sync and saves its start time after writing the files', async () => {
    const fetchedAt = '2026-10-01T01:02:00.000Z';
    query.mockImplementationOnce(async () => {
      vi.setSystemTime(fetchedAt);
      return { results: [page('one')], next_cursor: 'next' };
    });
    query.mockResolvedValueOnce({ results: [page('two')], next_cursor: null });
    update.mockImplementation(async ({ page_id }) => {
      expect(fs.readFileSync(path.join(postsDir, `${page_id}.md`), 'utf-8')).toBe(
        `${fetchedAt}\nSynced body`,
      );
    });

    await run();

    expect(query).toHaveBeenNthCalledWith(1, {
      data_source_id: 'test-source',
      filter: { and: [published, postFilter] },
      sorts: [{ property: 'date', direction: 'descending' }],
      start_cursor: undefined,
    });
    expect(query).toHaveBeenNthCalledWith(2, expect.objectContaining({ start_cursor: 'next' }));
    expect(update).toHaveBeenCalledWith({
      page_id: 'two',
      properties: { last_fetched_time: { date: { start: fetchedAt } } },
    });
    expect(fs.readdirSync(postsDir).sort()).toEqual(['one.md', 'two.md']);
    expect(JSON.parse(fs.readFileSync(stateFile, 'utf-8'))).toEqual({
      post: { lastSuccessfulRun: startedAt, lastFullSync: startedAt },
    });
  });

  it('retains the checkpoint and existing files when an incremental item fails', async () => {
    const state = { post: { lastSuccessfulRun: previousRun, lastFullSync: previousRun } };
    fs.writeFileSync(stateFile, JSON.stringify(state));
    query.mockResolvedValue({ results: [page('one'), page('two')], next_cursor: null });
    const error = new Error('Notion unavailable');
    const logError = vi.spyOn(console, 'error').mockImplementation(() => {});
    retrieve.mockRejectedValueOnce(error);

    await run();

    expect(logError.mock.calls).toEqual([['❌ Failed to update post one:', error]]);
    expect(query).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: {
          and: [
            published,
            postFilter,
            { timestamp: 'last_edited_time', last_edited_time: { on_or_after: previousRun } },
          ],
        },
      }),
    );
    expect(fs.readdirSync(postsDir).sort()).toEqual(['existing.md', 'two.md']);
    expect(JSON.parse(fs.readFileSync(stateFile, 'utf-8'))).toEqual(state);
  });
});
