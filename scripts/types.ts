export interface FetchConfig {
  notionDatabaseId: string;
  notionApiSecret: string;
  postsOutputDir: string; // posts 目录
  pagesOutputDir: string; // pages 目录
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
  page_id: string;
  icon?: string;
}

export interface FetchResult {
  updated: number;
  skipped: number;
  errors: number;
  deleted: number;
}

export interface KotobaMetadata {
  page_id: string;
  title: string;
  status: string;
  tags: string[];
  title_url: string;
  with_title: boolean;
  published_date: string;
  last_edited_time: string;
  blog_last_fetched_time: string | null;
}
