import { notionApiX } from '@/lib/notion/notion-api-x';

// https://github.com/mehdibha/folio/blob/main/src/app/blog/%5BpostSlug%5D/page.tsx
export default async function PostPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  // const page = await notionApiX.getPage();
}
