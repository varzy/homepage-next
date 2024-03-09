import { PostMetaData } from '@/lib/notion/notion-handler';
import { ReactNode } from 'react';
import { SITE_CONFIG } from '@/site.config';
import PostItem from './PostItem';
import Pagination, { PaginationProps } from '@/app/(blog)/_components/Pagination';

export default function PostsContainer({
  posts,
  currentPage,
  urlPrefix,
  children,
}: {
  posts: PostMetaData[];
  currentPage: number;
  urlPrefix: string;
  children?: ReactNode;
}) {
  const prePage = SITE_CONFIG.blogPerPage;
  const currentPagePosts = posts.slice((currentPage - 1) * prePage, currentPage * prePage);

  return (
    <>
      {children && (
        <div className="heading bg-gray-100">
          <div className="g-content-container">{children}</div>
        </div>
      )}
      <div className="g-content-container">
        <div className="posts ">
          {currentPagePosts.map((post) => (
            <PostItem key={post.id} {...post}></PostItem>
          ))}
        </div>
        <Pagination current={currentPage} pageSize={prePage} urlPrefix={urlPrefix} total={posts.length} />
      </div>
    </>
  );
}
