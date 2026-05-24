import { type Metadata } from 'next';
import { getEmojiFavicon } from '@/utils/favicon';
import { getAllPosts, getAllPostsCount, getPostsTotalWords } from '../../_lib/blog-loader';
import BlogPageContainer from '../_components/BlogPageContainer';
import PostItemArchive from '../_components/PostItemArchive';

export const metadata: Metadata = {
  title: 'Archive',
  icons: getEmojiFavicon('🗂️'),
};

export default async function ArchivePage() {
  const allPosts = await getAllPosts();
  const totalPosts = await getAllPostsCount();
  const totalWords = await getPostsTotalWords();

  return (
    <BlogPageContainer
      pageHero={{ title: 'Archive', after: `共 ${totalPosts} 篇文章，约 ${totalWords} 字。` }}
    >
      <div className="posts">
        {allPosts.map((post) => (
          <PostItemArchive key={post.page_id} {...post} />
        ))}
      </div>
    </BlogPageContainer>
  );
}
