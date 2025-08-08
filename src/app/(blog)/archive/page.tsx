import BlogPageContainer from '../_components/BlogPageContainer';
import PostItemArchive from '../_components/PostItemArchive';
import { getAllPosts } from '../_lib/content-loader';

export default async function ArchivePage() {
  const allPosts = await getAllPosts();

  return (
    <BlogPageContainer pageHero={{ title: 'Archive', after: `共有 ${allPosts.length} 篇文章。` }}>
      <div className="posts">
        {allPosts.map((post) => (
          <PostItemArchive key={post.notion_id} {...post} />
        ))}
      </div>
    </BlogPageContainer>
  );
}
