import { Metadata } from "next";
import Link from "next/link";
import BlogPageContainer from "@/app/(blog)/_components/BlogPageContainer";
import PostTag from "@/app/(blog)/_components/PostTag";
import { getAllPosts, getAllTags } from "@/app/_lib/blog-loader";
import { SITE_CONFIG } from "@/site.config";
import { getEmojiFavicon } from "@/utils/favicon";
import BlogSection from "../_components/BlogSection";

export const metadata: Metadata = {
  title: "Tags",
  icons: getEmojiFavicon("🏷️"),
};

export default async function ColumnsPage() {
  const categoriesConfig = SITE_CONFIG.categories;
  const categoryLinks = Object.keys(categoriesConfig).map((key) => {
    const category = categoriesConfig[key as keyof typeof categoriesConfig];
    return {
      label: category.alias,
      href: `/categories/${key}`,
      desc: category.description,
    };
  });

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
    <BlogPageContainer pageHero={{ title: "Columns" }}>
      <BlogSection title="Categories">
        {categoryLinks.map((category, index) => (
          <div className="mt-5" key={index}>
            <h2 className="font-bold text-base sm:text-lg">
              「
              <Link className="hover:underline" href={category.href}>
                {category.label}
              </Link>
              」
            </h2>
            <p className="text-muted text-sm sm:text-base mt-1.5 ">
              {category.desc}
            </p>
          </div>
        ))}
      </BlogSection>

      <BlogSection title="Tags">
        {sortedTags.map((tag, index) => (
          <div key={index} className="me-5 mb-3 inline-block">
            <PostTag tag={tag.tag} count={tag.postsCount} />
          </div>
        ))}
      </BlogSection>
    </BlogPageContainer>
  );
}
