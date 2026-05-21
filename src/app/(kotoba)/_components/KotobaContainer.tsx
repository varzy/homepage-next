import Pagination from '@/app/(blog)/_components/Pagination';
import { KotobaPostWithContent } from '@/app/_lib/content-loader';
import { KOTOBA_PER_PAGE } from '../_lib/kotoba-utils';
import KotobaCard from './KotobaCard';

interface KotobaContainerProps {
  posts: KotobaPostWithContent[];
  currentPage: number;
  urlPrefix: string;
}

export default function KotobaContainer({ posts, currentPage, urlPrefix }: KotobaContainerProps) {
  const start = (currentPage - 1) * KOTOBA_PER_PAGE;
  const pagePosts = posts.slice(start, start + KOTOBA_PER_PAGE);

  return (
    <>
      <div>
        {pagePosts.map((post) => (
          <KotobaCard key={post.page_id} post={post} />
        ))}
      </div>
      <Pagination
        current={currentPage}
        pageSize={KOTOBA_PER_PAGE}
        urlPrefix={urlPrefix}
        total={posts.length}
      />
    </>
  );
}
