import { NotionRenderer } from 'react-notion-x';
import { notion } from '@/lib/notion';
import Link from 'next/link';
import * as fs from 'fs';
import NotionPage from '@/components/NotionPage';
import { APP_CONFIG } from '@/app.config';

export async function generateStaticParams() {
  const databaseAllPages = await notion.getPage(APP_CONFIG.notionDatabaseId);
  // fs.writeFileSync('databaseAllPages.json', JSON.stringify(databaseAllPages, null, 2));

  const renderingPageIds = Object.keys(databaseAllPages.block).slice(0, 1);
  console.log(renderingPageIds);
  console.log(renderingPageIds.map((postId) => ({ postId })));

  return renderingPageIds.map((postId) => ({ postId }));

  // const pageIds = Object.keys(databaseAllPages.block);
  // fs.writeFileSync('pageIds.json', JSON.stringify(pageIds, null, 2));
  //
  // // for testing, just slice first 5 posts
  // const renderingPosts = pageIds.slice(0, 5);
  // fs.writeFileSync('renderingPosts.json', JSON.stringify(renderingPosts, null, 2));
  //
  // const fetchingTasks = renderingPosts.map(postId => {
  //   return notion.getPage(postId);
  // });
  // const allRecordMap = await Promise.all(fetchingTasks);
  // fs.writeFileSync('allRecordMap.json', JSON.stringify(allRecordMap, null, 2));
  // console.log(allRecordMap);
  //
  // return allRecordMap.map(item => ({ postRecordMap: item }));
}

export default async function PostPage({ params }: { params: { postId: string } }) {
  console.log(params);
  const { postId } = params;
  const postRecordMap = await notion.getPage(postId);

  return (
    <div>
      <NotionPage recordMap={postRecordMap} />
    </div>
  );
}
