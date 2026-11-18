import { Metadata } from 'next';
import Link from 'next/link';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import PostTag from '@/app/(blog)/_components/PostTag';
import { getAllPosts, getAllTags, getPostsByTag } from '@/app/_lib/post-loader';
import { SITE_CONFIG } from '@/site.config';
import { getEmojiFavicon } from '@/utils/favicon';
import BlogSection from '../_components/BlogSection';
import PostItemArchive from '../_components/PostItemArchive';

export const metadata: Metadata = {
  title: '栏目',
  icons: getEmojiFavicon('📰'),
};

export default async function ColumnsPage() {
  const allPosts = await getAllPosts();
  const tags = await getAllTags();

  const categoriesConfig = SITE_CONFIG.categories;
  const categoryLinks = Object.keys(categoriesConfig).map((key) => {
    const category = categoriesConfig[key as keyof typeof categoriesConfig];
    return {
      label: category.alias,
      href: `/categories/${key}`,
      desc: category.description,
    };
  });

  const tagsWithPostsCount = tags.map((tag) => {
    const tagPosts = allPosts.filter((post) => post.tags.includes(tag));
    return { tag, postsCount: tagPosts.length };
  });
  const sortedTags = tagsWithPostsCount
    .filter((tag) => tag.postsCount > 0)
    .sort((a, b) => b.postsCount - a.postsCount);

  const pinnedPosts = await getPostsByTag('精选');

  return (
    <BlogPageContainer pageHero={{ title: '栏目' }}>
      <BlogSection title="Categories">
        {categoryLinks.map((category, index) => (
          <div className="mt-5" key={index}>
            <h3 className="text-base font-bold">
              「
              <Link className="hover:underline" href={category.href}>
                {category.label}
              </Link>
              」
            </h3>
            <p className="text-muted mt-1.5 text-sm">{category.desc}</p>
          </div>
        ))}
      </BlogSection>

      <BlogSection title="Tags">
        <ul className="m-0 list-none p-0">
          {sortedTags.map(({ tag, postsCount }) => (
            <li key={tag} className="me-5 mb-3 inline-block">
              <PostTag tag={tag} count={postsCount} />
            </li>
          ))}
        </ul>
      </BlogSection>

      <BlogSection title="Pinned">
        {pinnedPosts.map((post) => (
          <PostItemArchive key={post.page_id} {...post} dateTpl="MMM DD, YYYY"></PostItemArchive>
        ))}
      </BlogSection>
    </BlogPageContainer>
  );
}
