import { getAllPosts, getPostBySlug, getPostWithContent } from '@/app/(blog)/_lib/content-loader';
import { notFound } from 'next/navigation';
import PostTag from '@/app/(blog)/_components/PostTag';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import BuyMeACoffee from '@/app/(blog)/_components/BuyMeACoffee';
import { getEmojiFavicon } from '@/utils/favicon';
import MdxRenderer from '@/app/(blog)/_components/MdxRenderer';

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

  return (
    <BlogPageContainer
      pageHero={{
        title: postWithContent.title,
        before: postWithContent.dateAmericaStyle,
        after: (
          <div className="mt-2">
            {postWithContent.tags.length > 0 && postWithContent.tags.map((tag) => <PostTag key={tag} tag={tag} />)}
          </div>
        ),
      }}
    >
      <MdxRenderer source={postWithContent.content} />
      {postWithContent.category === 'Coding' && (
        <div className="mx-auto my-8 max-w-md">
          <BuyMeACoffee />
        </div>
      )}
    </BlogPageContainer>
  );
}
