import Pagination from '@/app/_components/Pagination';
import { PostMeta } from '@/app/_lib/post-loader';
import { SITE_CONFIG } from '@/site.config';
import PostItem from './PostItem';

export default function PostsContainer({
  posts,
  currentPage,
  showCategory = true,
  showTags = true,
  showYear = true,
  urlPrefix = '/',
}: {
  posts: PostMeta[];
  currentPage: number;
  urlPrefix?: string;
  showCategory?: boolean;
  showTags?: boolean;
  showYear?: boolean;
}) {
  const prePage = SITE_CONFIG.blogPerPage;
  const currentPagePosts = posts.slice((currentPage - 1) * prePage, currentPage * prePage);

  return (
    <>
      <div className="posts">
        {currentPagePosts.map((post) => (
          <PostItem
            key={post.page_id}
            showCategory={showCategory}
            showTags={showTags}
            showYear={showYear}
            {...post}
          ></PostItem>
        ))}
      </div>
      <Pagination
        current={currentPage}
        pageSize={prePage}
        urlPrefix={urlPrefix}
        total={posts.length}
      />
    </>
  );
}
