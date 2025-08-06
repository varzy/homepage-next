import { NotionToMarkdown } from 'notion-to-md';
import { notionClient } from '@/app/(blog)/_lib/notion-client';

export const notionToMarkdown = new NotionToMarkdown({ notionClient: notionClient });
