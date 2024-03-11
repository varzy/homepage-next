import { PostMetaData } from '@/app/(blog)/_lib/notion-handler';
import { ReactNode } from 'react';
import { SITE_CONFIG } from '@/site.config';
import PostItem from './PostItem';
import Pagination from '@/app/(blog)/_components/Pagination';

export default function PostsContainer({
  posts,
  currentPage,
  urlPrefix = '/',
  pagination = true,
  children,
}: {
  posts: PostMetaData[];
  currentPage: number;
  urlPrefix?: string;
  pagination?: boolean;
  children?: ReactNode;
}) {
  const prePage = SITE_CONFIG.blogPerPage;
  const currentPagePosts = posts.slice((currentPage - 1) * prePage, currentPage * prePage);

  return (
    <>
      {children && <div>{children}</div>}
      <div className="g-blog-container">
        <div className="posts">
          {currentPagePosts.map((post) => (
            <PostItem key={post.id} {...post}></PostItem>
          ))}
        </div>
        {pagination && (
          <Pagination current={currentPage} pageSize={prePage} urlPrefix={urlPrefix} total={posts.length} />
        )}
      </div>
    </>
  );
}
