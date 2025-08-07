import BlogPageContainer from '../_components/BlogPageContainer';
import PostItemLite from '../_components/PostItemLite';
import { getAllPosts } from '../_lib/content-loader';

export default async function ArchivePage() {
  const allPosts = await getAllPosts();

  return (
    <BlogPageContainer pageHero={{ title: 'Archive' }}>
      <div className="posts">
        {allPosts.map((post) => (
          <PostItemLite key={post.notion_id} {...post}></PostItemLite>
        ))}
      </div>
    </BlogPageContainer>
  );
}
