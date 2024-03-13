import { getAllPagesWithMeta, getPageBySlug } from '@/app/(blog)/_lib/notion-handler';
import { SITE_CONFIG } from '@/site.config';
import { notFound } from 'next/navigation';
import { notionToMarkdown } from '@/app/(blog)/_lib/notion-to-markdown';
import PostTag from '@/app/(blog)/_components/PostTag';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import BuyMeACoffee from '@/app/(blog)/_components/BuyMeACoffee';
import { getEmojiFavicon } from '@/utils/favicon';
import Prose from '@/app/(blog)/_components/Prose';

interface PageProps {
  params: { slug: string };
}

// 由于 Notion 图片存在 1 小时的过期时间，但 revalidate 即使重新生成也只能在第二次访问时返回新的数据，因此需要使用定时任务辅助刷新，因此真实的刷新时间将依据定时任务而定
// 如此一来便可同时用到缓存功能，并能保证图片可用。注意，定时任务间隔时间要小于 3600 - revalidate，如此一来才能保证每个窗口期都能被触发
// 但实际上只要触发任何一次后，缓存时间都将被拉齐，如果不在意首次可访问性则可以把定时任务时间设置的稍大一些，比如 50min
// 60m - 30m = 30min = 1800s, 因此可以设置定时任务 20min 触发一次
// 最终的缓存时间 = min(revalidate, cronSchedule) = 20min
export const revalidate = 1800;

// export const cache = 'no-chce';

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
    <BlogPageContainer
      pageHero={{
        title: targetPost.title,
        before: targetPost.dateAmericaStyle,
        after: (
          <div className="mt-2">
            {targetPost.tags.length > 0 && targetPost.tags.map((tag) => <PostTag key={tag} tag={tag} />)}
          </div>
        ),
      }}
      extra={targetPost.category === 'Coding' ? <BuyMeACoffee /> : undefined}
    >
      <Prose markdown={mdString.parent}></Prose>
    </BlogPageContainer>
  );
}
