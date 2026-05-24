import Pagination from '@/app/_components/Pagination';
import { KotobaPostWithContent } from '@/app/_lib/content-loader';
import { SITE_CONFIG } from '@/site.config';
import KotobaCard from './KotobaCard';

interface KotobaContainerProps {
  posts: KotobaPostWithContent[];
  currentPage: number;
  urlPrefix: string;
}

export default function KotobaContainer({ posts, currentPage, urlPrefix }: KotobaContainerProps) {
  const start = (currentPage - 1) * SITE_CONFIG.kotobaPerPage;
  const pagePosts = posts.slice(start, start + SITE_CONFIG.kotobaPerPage);

  return (
    <>
      <div>
        {pagePosts.map((post) => (
          <KotobaCard key={post.page_id} post={post} />
        ))}
      </div>
      <Pagination
        current={currentPage}
        pageSize={SITE_CONFIG.kotobaPerPage}
        urlPrefix={urlPrefix}
        total={posts.length}
      />
    </>
  );
}
