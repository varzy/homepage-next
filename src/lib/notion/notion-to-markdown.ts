import { NotionToMarkdown } from 'notion-to-md';
import { notionClient } from '@/lib/notion/notion-client';

export const notionToMarkdown = new NotionToMarkdown({ notionClient: notionClient });
