import { Client } from '@notionhq/client';
import { SITE_CONFIG } from '@/site.config';

export const notionApiHq = new Client({
  auth: SITE_CONFIG.notionApiSecret,
});
