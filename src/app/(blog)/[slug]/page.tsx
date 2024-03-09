import { getAllDatabasePages, getAllPagesWithMeta } from '@/lib/notion/notion-handler';
import { SITE_CONFIG } from '@/site.config';
import { notFound } from 'next/navigation';
import { notionToMarkdown } from '@/lib/notion/notion-to-markdown';
import NotionPage from '@/components/NotionPage';

export async function generateStaticParams() {
  const allPosts = await getAllPagesWithMeta({
    database_id: SITE_CONFIG.notionDatabaseId,
    filter: {
      and: [
        { property: 'status', select: { equals: 'Published' } },
        { property: 'type', select: { equals: 'Post' } },
      ],
    },
  });

  return allPosts.map((post) => ({ slug: post.slug }));
}

export default async function Post({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const allPosts = await getAllPagesWithMeta({
    database_id: SITE_CONFIG.notionDatabaseId,
    filter: {
      and: [
        { property: 'status', select: { equals: 'Published' } },
        { property: 'type', select: { equals: 'Post' } },
      ],
    },
  });
  const targetPost = allPosts.find((post) => post.slug === slug);
  if (!targetPost) notFound();

  const mdBlocks = await notionToMarkdown.pageToMarkdown(targetPost.id);
  const mdString = notionToMarkdown.toMarkdownString(mdBlocks);

  console.log(mdString);

  return (
    <div className="post_page">
      <p>{targetPost.id}</p>
      <hr />
      <NotionPage markdown={mdString.parent}></NotionPage>
    </div>
  );
}
