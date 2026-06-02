export interface FetchResult {
  updated: number;
  skipped: number;
  errors: number;
  deleted: number;
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
  last_fetched_time: string | null;
  page_id: string;
  icon?: string;
}

export interface PageMetadata {
  page_id: string;
  title: string;
  slug: string;
  status: string;
  last_edited_time: string;
  last_fetched_time: string | null;
}

export interface KotobaMetadata {
  page_id: string;
  title: string;
  status: string;
  tags: string[];
  title_url: string;
  with_title: boolean;
  published_time: string;
  last_edited_time: string;
  last_fetched_time: string | null;
}

export interface TasteMetadata {
  page_id: string;
  title: string;
  status: string;
  category: string;
  cover: string;
  url?: string;
  label?: string;
  last_edited_time: string;
  last_fetched_time: string | null;
}
