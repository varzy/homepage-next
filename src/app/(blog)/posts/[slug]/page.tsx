import { getAllPagesWithMeta, getPageBySlug } from '@/app/(blog)/_lib/notion-handler';
import { SITE_CONFIG } from '@/site.config';
import { notFound } from 'next/navigation';
import { notionToMarkdown } from '@/app/(blog)/_lib/notion-to-markdown';
import NotionPage from '@/app/(blog)/_components/NotionPage';
import PageHero from '@/app/(blog)/_components/PageHero';
import PostTag from '@/app/(blog)/_components/PostTag';
import { getEmojiFavicon } from '@/utils/helpers';

interface PageProps {
  params: { slug: string };
}

// https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#time-based-revalidation
// unit: s. 60 = 1min
// Notion images will expire after 3600s, so we must revalidate less than 1 hour.
export const revalidate = 600;

export async function generateMetadata({ params }: PageProps) {
  const { slug } = params;

  const page = await getPageBySlug(
    {
      database_id: SITE_CONFIG.notionDatabaseId,
      filter: {
        and: [
          { property: 'status', select: { equals: 'Published' } },
          { property: 'type', select: { equals: 'Post' } },
        ],
      },
    },
    slug,
  );
  if (!page) return {};

  return {
    title: page.title,
    description: page.summary,
    icons: getEmojiFavicon(page.icon),
  };
}

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

export default async function Post({ params }: PageProps) {
  const { slug } = params;

  const targetPost = await getPageBySlug(
    {
      database_id: SITE_CONFIG.notionDatabaseId,
      filter: {
        and: [
          { property: 'status', select: { equals: 'Published' } },
          { property: 'type', select: { equals: 'Post' } },
        ],
      },
    },
    slug,
  );
  if (!targetPost) notFound();

  const mdBlocks = await notionToMarkdown.pageToMarkdown(targetPost.id);
  const mdString = notionToMarkdown.toMarkdownString(mdBlocks);

  return (
    <>
      <PageHero
        title={targetPost.title}
        before={targetPost.dateAmericaStyle}
        after={
          <div className="mt-2">
            {targetPost.tags.length > 0 && targetPost.tags.map((tag) => <PostTag key={tag} tag={tag} />)}
          </div>
        }
      ></PageHero>
      <div className="g-blog-container py-6">
        <NotionPage markdown={mdString.parent}></NotionPage>
      </div>
    </>
  );
}
