import { SITE_CONFIG } from '@/site.config';
import { getAllPagesWithMeta, getDatabaseTags } from '@/app/(blog)/_lib/notion-handler';
import PostTag from '@/app/(blog)/_components/PostTag';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '标签',
};

export default async function Tag() {
  const allPosts = await getAllPagesWithMeta({ database_id: SITE_CONFIG.notionDatabaseId });
  const tags = await getDatabaseTags({ database_id: SITE_CONFIG.notionDatabaseId });

  const tagsWithPostsCount = tags.map((tag) => {
    const tagPosts = allPosts.filter((post) => post.tags.includes(tag));
    return { tag, postsCount: tagPosts.length };
  });
  const sortedTags = tagsWithPostsCount.filter((tag) => tag.postsCount > 0).sort((a, b) => b.postsCount - a.postsCount);

  return (
    <div className="g-blog-container">
      {sortedTags.map((tag, index) => (
        <div key={index} className="mb-2 mr-4 inline-block">
          <PostTag tag={tag.tag} count={tag.postsCount} />
        </div>
      ))}
    </div>
  );
}
