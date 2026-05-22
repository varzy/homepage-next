import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageHero from '@/app/(blog)/_components/PageHero';
import {
  getAllKotobaPosts,
  getAllKotobaTags,
  getKotobaPostsWithContentByTag,
} from '@/app/_lib/content-loader';
import KotobaContainer from '../../../../_components/KotobaContainer';
import KotobaTag from '../../../../_components/KotobaTag';
import { KOTOBA_PER_PAGE } from '../../../../_lib/kotoba-utils';

export async function generateStaticParams() {
  const [allPosts, allTags] = await Promise.all([getAllKotobaPosts(), getAllKotobaTags()]);

  return allTags.flatMap((tag) => {
    const count = allPosts.filter((p) => p.tags.includes(tag)).length;
    if (count === 0) return [];
    const totalPages = Math.ceil(count / KOTOBA_PER_PAGE);
    return Array.from({ length: totalPages }, (_, i) => ({
      tag: encodeURIComponent(tag),
      page: [String(i + 1)],
    }));
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const decoded = safeDecodeTag(tag);
  return { title: `#${decoded} · 言叶` };
}

function safeDecodeTag(raw: string): string {
  try {
    const once = decodeURIComponent(raw);
    return once.includes('%') ? decodeURIComponent(once) : once;
  } catch {
    return raw;
  }
}

export default async function KotobaTagPage({
  params,
}: {
  params: Promise<{ tag: string; page?: string[] }>;
}) {
  const { tag: rawTag, page: pageParam = [] } = await params;
  if (pageParam.length > 1) notFound();

  const currentPage = +(pageParam[0] || 1);
  if (isNaN(currentPage) || currentPage < 1) notFound();

  const tagText = safeDecodeTag(rawTag);

  const [allPosts, posts] = await Promise.all([
    getAllKotobaPosts(),
    getKotobaPostsWithContentByTag(tagText),
  ]);

  if (posts.length === 0) notFound();

  // Build tag list for the header, sorted by count, marking the active one
  const tagCountMap = new Map<string, number>();
  allPosts.forEach((p) => p.tags.forEach((t) => tagCountMap.set(t, (tagCountMap.get(t) ?? 0) + 1)));
  const sortedTags = Array.from(tagCountMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([tag, count]) => ({ tag, count }));

  const TagSection = (
    <div className="mt-3 flex flex-wrap gap-y-2">
      {sortedTags.map(({ tag, count }) => (
        <KotobaTag key={tag} tag={tag} count={count} active={tag === tagText} />
      ))}
    </div>
  );

  return (
    <>
      <PageHero title="言叶" after={TagSection} />
      <div className="g-container pb-20">
        <KotobaContainer
          posts={posts}
          currentPage={currentPage}
          urlPrefix={`/kotoba/tag/${rawTag}`}
        />
      </div>
    </>
  );
}
