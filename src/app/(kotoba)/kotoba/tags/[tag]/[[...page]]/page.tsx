import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PageHero from '@/app/_components/PageHero';
import {
  getAllKotobaPosts,
  getAllKotobaTags,
  getKotobaPostsWithContentByTag,
} from '@/app/_lib/content-loader';
import { SITE_CONFIG } from '@/site.config';
import KotobaContainer from '../../../../_components/KotobaContainer';

export async function generateStaticParams() {
  const [allPosts, allTags] = await Promise.all([getAllKotobaPosts(), getAllKotobaTags()]);

  return allTags.flatMap((tag) => {
    const count = allPosts.filter((p) => p.tags.includes(tag)).length;
    if (count === 0) return [];
    const totalPages = Math.ceil(count / SITE_CONFIG.kotobaPerPage);
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
  const posts = await getKotobaPostsWithContentByTag(tagText);

  if (posts.length === 0) notFound();

  return (
    <>
      <PageHero title="言叶" />
      <div className="g-container pb-20">
        <KotobaContainer
          posts={posts}
          currentPage={currentPage}
          urlPrefix={`/kotoba/tags/${rawTag}`}
        />
      </div>
    </>
  );
}
