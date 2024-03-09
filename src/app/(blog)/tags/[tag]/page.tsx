import { SITE_CONFIG } from '@/site.config';
import { notFound } from 'next/navigation';
import { getAllPagesWithMeta } from '@/lib/notion/notion-handler';
import PostsContainer from '@/app/(blog)/_components/PostsContainer';
import PageHero from '@/app/(blog)/_components/PageHero';

interface PageProps {
  params: { category: keyof typeof SITE_CONFIG.categories; page?: string[] };
}

export async function generateStaticParams() {
  const categoriesConfig = SITE_CONFIG.categories;
  const presetCategories = Object.keys(categoriesConfig).map((key) => ({
    routeParam: key,
    filed: categoriesConfig[key as keyof typeof categoriesConfig].notionField,
  }));

  const allPosts = await getAllPagesWithMeta({
    database_id: SITE_CONFIG.notionDatabaseId,
    filter: {
      and: [
        { property: 'status', select: { equals: 'Published' } },
        { property: 'type', select: { equals: 'Post' } },
        {
          or: presetCategories.map((category) => ({
            property: 'category',
            select: { equals: category.filed },
          })),
        },
      ],
    },
  });

  const renderingGroups = presetCategories.map((category) => {
    const categoryPosts = allPosts.filter((post) => post.category === category.filed);
    if (categoryPosts.length === 0) return [];
    const totalPages = Math.ceil(categoryPosts.length / SITE_CONFIG.blogPerPage);
    return Array.from({ length: totalPages }).map((_, i) => ({ category: category.routeParam, page: [i + 1 + ''] }));
  });
  return renderingGroups.reduce((all, group) => [...all, ...group], []);
}

export default async function Tag({ params }: { params: { tag: string } }) {
  const { tag } = params;
  const allPosts = await getAllPagesWithMeta({
    database_id: SITE_CONFIG.notionDatabaseId,
    filter: {
      and: [
        { property: 'status', select: { equals: 'Published' } },
        { property: 'type', select: { equals: 'Post' } },
        { property: 'tags', multi_select: { contains: tag } },
      ],
    },
    sorts: [{ property: 'date', direction: 'descending' }],
  });

  return (
    <PostsContainer posts={allPosts} currentPage={1}>
      <PageHero title={'#' + tag}></PageHero>
      {/*<h1>{categoryCtx.alias}</h1>*/}
      {/*<p>{categoryCtx.description}</p>*/}
    </PostsContainer>
  );
}
