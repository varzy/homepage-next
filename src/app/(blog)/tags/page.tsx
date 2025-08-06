import { getAllPosts, getAllTags } from '@/app/(blog)/_lib/content-loader';
import PostTag from '@/app/(blog)/_components/PostTag';
import { Metadata } from 'next';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import { getEmojiFavicon } from '@/utils/favicon';

export const metadata: Metadata = {
  title: 'Tags',
  icons: getEmojiFavicon('🏷️'),
};

export default async function Tag() {
  const allPosts = await getAllPosts();
  const tags = await getAllTags();

  const tagsWithPostsCount = tags.map((tag) => {
    const tagPosts = allPosts.filter((post) => post.tags.includes(tag));
    return { tag, postsCount: tagPosts.length };
  });

  const sortedTags = tagsWithPostsCount
    .filter((tag) => tag.postsCount > 0)
    .sort((a, b) => b.postsCount - a.postsCount);

  return (
    <BlogPageContainer pageHero={{ title: 'Tags' }}>
      {sortedTags.map((tag, index) => (
        <div key={index} className="mb-2 mr-4 inline-block">
          <PostTag tag={tag.tag} count={tag.postsCount} />
        </div>
      ))}
    </BlogPageContainer>
  );
}
