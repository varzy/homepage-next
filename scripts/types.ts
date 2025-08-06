export interface FetchConfig {
  notionDatabaseId: string;
  notionApiSecret: string;
  outputDir: string;
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
  blog_last_fetched_time: string | null;
  notion_id: string;
}

export interface FetchResult {
  updated: number;
  skipped: number;
  errors: number;
}
