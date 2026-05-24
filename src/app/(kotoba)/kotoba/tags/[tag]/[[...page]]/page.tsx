import { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHero from "@/app/_components/PageHero";
import {
  getAllKotobaPosts,
  getAllKotobaTags,
  getKotobaPostsWithContentByTag,
} from "@/app/_lib/kotoba-loader";
import { buildTagPageParams } from "@/app/_lib/pagination-utils";
import { SITE_CONFIG } from "@/site.config";
import { safeDecodeTag } from "@/utils/url";
import KotobaContainer from "../../../../_components/KotobaContainer";

export const dynamicParams = false;

export async function generateStaticParams() {
  const [allPosts, allTags] = await Promise.all([getAllKotobaPosts(), getAllKotobaTags()]);
  return buildTagPageParams(allPosts, allTags, SITE_CONFIG.kotobaPerPage);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ tag: string }>;
}): Promise<Metadata> {
  const { tag } = await params;
  const decoded = safeDecodeTag(tag);
  return { title: `#${decoded}` };
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
      <PageHero title={"#" + tagText} />
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
