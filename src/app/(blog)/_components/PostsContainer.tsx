import { PostMetaData } from '@/app/(blog)/_lib/notion-handler';
import { SITE_CONFIG } from '@/site.config';
import PostItem from './PostItem';
import Pagination from '@/app/(blog)/_components/Pagination';

export default function PostsContainer({
  posts,
  currentPage,
  urlPrefix = '/',
}: {
  posts: PostMetaData[];
  currentPage: number;
  urlPrefix?: string;
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
      <Pagination current={currentPage} pageSize={prePage} urlPrefix={urlPrefix} total={posts.length} />
    </>
  );
}
