import { PostMetaData } from '@/app/(blog)/_lib/notion-handler';
import { SITE_CONFIG } from '@/site.config';
import PostItem from './PostItem';
import Pagination from '@/app/(blog)/_components/Pagination';

export default function PostsContainer({
  posts,
  currentPage,
  urlPrefix = '/',
  pagination = true,
}: {
  posts: PostMetaData[];
  currentPage: number;
  urlPrefix?: string;
  pagination?: boolean;
}) {
  const prePage = SITE_CONFIG.blogPerPage;
  const currentPagePosts = posts.slice((currentPage - 1) * prePage, currentPage * prePage);

  return (
    <>
      <div className="posts">
        {currentPagePosts.map((post) => (
          <PostItem key={post.id} {...post}></PostItem>
        ))}
      </div>
      {pagination && (
        <div className="mt-4">
          <Pagination current={currentPage} pageSize={prePage} urlPrefix={urlPrefix} total={posts.length} />
        </div>
      )}
    </>
  );
}
