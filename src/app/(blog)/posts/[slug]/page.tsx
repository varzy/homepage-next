import { notFound } from "next/navigation";
import BlogPageContainer from "@/app/(blog)/_components/BlogPageContainer";
import NextPost from "@/app/(blog)/_components/NextPost";
import PostFooter from "@/app/(blog)/_components/PostFooter";
import MdxRenderer from "@/app/_components/MdxRenderer";
import {
  getAllPosts,
  getCurrentCategoryNextPost,
  getPostBySlug,
  getPostWithContent,
} from "@/app/_lib/blog-loader";
import { getEmojiFavicon } from "@/utils/favicon";
import PostTag from "../../_components/PostTag";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;

  const post = await getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.summary,
    icons: getEmojiFavicon(post.icon),
  };
}

export async function generateStaticParams() {
  const allPosts = await getAllPosts();
  return allPosts.map((post) => ({ slug: post.slug }));
}

export default async function Post({ params }: PageProps) {
  const { slug } = await params;

  const postWithContent = await getPostWithContent(slug);
  if (!postWithContent) notFound();

  const nextPost = await getCurrentCategoryNextPost(
    postWithContent.category,
    postWithContent.slug,
  );

  return (
    <BlogPageContainer
      pageHero={{
        title: postWithContent.title,
        after: (
          <div className="text-sm">
            <span className="text-secondary">
              {postWithContent.dateAmericaStyle}
            </span>
            <span>, in </span>
            <span>日常</span>
            <span className="ms-5">
              {postWithContent.tags.length > 0 &&
                postWithContent.tags.map((tag) => (
                  <PostTag key={tag} tag={tag} />
                ))}
            </span>
          </div>
        ),
      }}
    >
      <MdxRenderer source={postWithContent.content} />
      <PostFooter />
      <NextPost nextPost={nextPost} />
    </BlogPageContainer>
  );
}
