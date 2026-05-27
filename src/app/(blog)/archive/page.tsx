import { type Metadata } from 'next';
import { getEmojiFavicon } from '@/utils/favicon';
import { getAllPosts, getAllPostsCount, getPostsTotalWords } from '../../_lib/blog-loader';
import type { PostMeta } from '../../_lib/blog-loader';
import BlogPageContainer from '../_components/BlogPageContainer';
import BlogSection from '../_components/BlogSection';
import PostItemArchive from '../_components/PostItemArchive';

export const metadata: Metadata = {
  title: 'Archive',
  icons: getEmojiFavicon('🗂️'),
};

function groupPostsByYear(posts: PostMeta[]): Record<string, PostMeta[]> {
  const groups: Record<string, PostMeta[]> = {};
  for (const post of posts) {
    const year = post.date.slice(0, 4);
    if (!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(post);
  }
  return groups;
}

export default async function ArchivePage() {
  const allPosts = await getAllPosts();
  const totalPosts = await getAllPostsCount();
  const totalWords = await getPostsTotalWords();

  const groupedPosts = groupPostsByYear(allPosts);
  const sortedYears = Object.keys(groupedPosts).sort((a, b) => Number(b) - Number(a));

  return (
    <BlogPageContainer
      pageHero={{ title: 'Archive', after: `共 ${totalPosts} 篇文章，约 ${totalWords} 字。` }}
    >
      {sortedYears.map((year) => (
        <BlogSection key={year} title={year}>
          {groupedPosts[year].map((post) => (
            <PostItemArchive key={post.page_id} {...post} />
          ))}
        </BlogSection>
      ))}
    </BlogPageContainer>
  );
}
