import { redirect } from 'next/navigation';
import { SITE_CONFIG } from '@/site.config';

export function GET() {
  const firstCategory = Object.keys(SITE_CONFIG.categories)[0];
  redirect(`/categories/${firstCategory}/1`);
}
