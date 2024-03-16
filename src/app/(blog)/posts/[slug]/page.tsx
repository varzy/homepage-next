import { composeDatabaseQuery, getAllPagesWithMeta, getPageBySlug } from '@/app/(blog)/_lib/notion-handler';
import { notFound } from 'next/navigation';
import { notionToMarkdown } from '@/app/(blog)/_lib/notion-to-markdown';
import PostTag from '@/app/(blog)/_components/PostTag';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import BuyMeACoffee from '@/app/(blog)/_components/BuyMeACoffee';
import { getEmojiFavicon } from '@/utils/favicon';
import Prose from '@/app/(blog)/_components/Prose';
import { unstable_cache as cache } from 'next/cache';
import { SITE_CONFIG } from '@/site.config';

interface PageProps {
  params: { slug: string };
}

const getNotionMarkdown = cache(async (pageId: string) => {
  const mdBlocks = await notionToMarkdown.pageToMarkdown(pageId);
  return notionToMarkdown.toMarkdownString(mdBlocks);
});

export async function generateMetadata({ params }: PageProps) {
  const { slug } = params;

  const page = await getPageBySlug(composeDatabaseQuery(), slug);
  if (!page) return {};

  return {
    title: page.title,
    description: page.summary,
    icons: getEmojiFavicon(page.icon),
  };
}

/**
 * 注意，此处仅静态生成每个分类中靠前的部分文章
 */
export async function generateStaticParams() {
  const GENERATING_POSTS_COUNT = SITE_CONFIG.blogPerPage;
  const allPosts = await getAllPagesWithMeta(composeDatabaseQuery());
  const categoryFields = Object.values(SITE_CONFIG.categories).map((categoryCtx) => categoryCtx.notionField);
  const categoryPostsGroup = categoryFields.map((field) =>
    allPosts.filter((post) => post.category === field).slice(0, GENERATING_POSTS_COUNT),
  );
  const generatingPosts = categoryPostsGroup.reduce((allPosts, categoryPosts) => [...allPosts, ...categoryPosts], []);
  return generatingPosts.map((post) => ({ slug: post.slug }));
}

export default async function Post({ params }: PageProps) {
  const { slug } = params;
  console.log(`[posts/[slug]] Current slug: ${slug}`);

  const targetPost = await getPageBySlug(composeDatabaseQuery(), slug);
  if (!targetPost) notFound();

  const mdString = await getNotionMarkdown(targetPost.id);

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
