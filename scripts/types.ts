export interface FetchResult {
  updated: number;
  errors: number;
  deleted: number;
}

export type SyncMode = 'incremental' | 'full-sync' | 'force';

export interface FetchStateEntry {
  lastSuccessfulRun: string;
  lastFullSync: string;
}

export interface FetchState {
  [label: string]: FetchStateEntry;
}

export interface SyncMetadata {
  page_id: string;
  last_edited_time: string;
  last_fetched_time: string | null;
}

export interface PostMetadata extends SyncMetadata {
  title: string;
  category: string;
  type: string;
  status: string;
  tags: string[];
  date: string;
  slug: string;
  summary: string;
  icon?: string;
}

export interface PageMetadata extends SyncMetadata {
  title: string;
  slug: string;
  status: string;
}

export interface KotobaMetadata extends SyncMetadata {
  title: string;
  status: string;
  tags: string[];
  title_url: string;
  with_title: boolean;
  published_time: string;
}

export interface TasteMetadata extends SyncMetadata {
  title: string;
  alias?: string;
  status: string;
  category: string;
  cover: string;
  url?: string;
  label?: string;
}
