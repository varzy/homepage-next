import { Metadata } from 'next';
import Link from 'next/link';
import PageHero from '@/app/_components/PageHero';
import { getAllKotobaPosts, getAllKotobaTags } from '@/app/_lib/kotoba-loader';
import { getEmojiFavicon } from '@/utils/favicon';

export const metadata: Metadata = {
  title: '标签',
  icons: getEmojiFavicon('🏷️'),
};

export default async function KotobaTagsPage() {
  const [allPosts, tags] = await Promise.all([getAllKotobaPosts(), getAllKotobaTags()]);

  const tagsWithPostsCount = tags.map((tag) => {
    const tagPosts = allPosts.filter((post) => post.tags.includes(tag));
    return { tag, postsCount: tagPosts.length };
  });

  const sortedTags = tagsWithPostsCount
    .filter((tag) => tag.postsCount > 0)
    .sort((a, b) => b.postsCount - a.postsCount);

  return (
    <>
      <PageHero title="Tags" />

      <div className="g-container">
        <section className="mb-12 last:mb-0" aria-label="标签云">
          <ul className="m-0 mt-4 list-none p-0">
            {sortedTags.map((tag, index) => (
              <li key={index} className="me-5 mb-3 inline-block">
                <Link
                  href={`/kotoba/tags/${encodeURIComponent(tag.tag)}`}
                  className="me-3 text-sm last:me-0 hover:underline"
                >
                  <span>#{tag.tag}</span>
                  <span className="text-secondary"> {tag.postsCount}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
