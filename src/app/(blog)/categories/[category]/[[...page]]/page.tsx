import { SITE_CONFIG } from '@/site.config';
import * as fs from 'fs';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllDatabasePages, getAllPagesWithMeta, getPageMeta } from '@/lib/notion/notion-handler';

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

export default async function Page({ params }: PageProps) {
  const { category: categoryParam, page: optionalPageParam = [] } = params;
  if (optionalPageParam.length > 1) notFound();
  // 页码
  const [optionalPage] = optionalPageParam;
  const currentPage = +(optionalPage || 1);
  // 类别
  const categoryCtx = SITE_CONFIG.categories[categoryParam];
  const categoryField = categoryCtx.notionField;
  // 获取当前类别下全部文章
  const allPosts = await getAllPagesWithMeta({
    database_id: SITE_CONFIG.notionDatabaseId,
    filter: {
      and: [
        { property: 'status', select: { equals: 'Published' } },
        { property: 'type', select: { equals: 'Post' } },
        { property: 'category', select: { equals: categoryField } },
      ],
    },
    sorts: [{ property: 'date', direction: 'descending' }],
  });

  const prePage = SITE_CONFIG.blogPerPage;
  const currentPagePosts = allPosts.slice((currentPage - 1) * prePage, currentPage * prePage);
  const showPrev = currentPage > 2;
  const showNext = currentPage * SITE_CONFIG.blogPerPage < allPosts.length;

  return (
    <div>
      <h1>{categoryCtx.alias}</h1>
      <h2>{categoryCtx.description}</h2>
      <hr />
      {currentPagePosts.map((post) => (
        <div key={post.id}>
          <Link className="hover:text-red-500" href={'/' + post.slug}>
            {post.title}
          </Link>
        </div>
      ))}
      <hr />
      <div>{showPrev && 'PREV'}</div>
      <div>{showNext && 'NEXT'}</div>
    </div>
  );
}
