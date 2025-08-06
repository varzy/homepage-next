export interface FetchConfig {
  notionDatabaseId: string;
  notionApiSecret: string;
  outputDir: string;
  lastFetchFile: string;
}

export interface PostMetadata {
  title: string;
  category: string;
  type: string;
  status: string;
  tags: string[];
  date: string;
  slug: string;
  summary: string;
  last_edited_time: string;
  notion_id: string;
}

export interface FetchResult {
  updated: number;
  skipped: number;
  errors: number;
}
