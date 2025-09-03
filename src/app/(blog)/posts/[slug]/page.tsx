import { getAllPosts, getNextPost, getPostBySlug, getPostWithContent, getPrevPost } from '@/app/_lib/content-loader';
import { notFound } from 'next/navigation';
import PostTagLite from '@/app/(blog)/_components/PostTagLite';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import { getEmojiFavicon } from '@/utils/favicon';
import MdxRenderer from '@/app/(blog)/_components/MdxRenderer';
import PrevAndNextPosts from '@/app/(blog)/_components/PrevAndNextPosts';

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

  const prevPost = await getPrevPost(postWithContent.category, postWithContent.slug);
  const nextPost = await getNextPost(postWithContent.category, postWithContent.slug);

  return (
    <BlogPageContainer
      pageHero={{
        title: postWithContent.title,
        after: (
          <div className="text-sm">
            <span className="text-secondary me-3">{postWithContent.dateAmericaStyle}</span>
            {postWithContent.tags.length > 0 && postWithContent.tags.map((tag) => <PostTagLite key={tag} tag={tag} />)}
          </div>
        ),
      }}
    >
      <MdxRenderer source={postWithContent.content} />
      <PrevAndNextPosts prevPost={prevPost} nextPost={nextPost} />
    </BlogPageContainer>
  );
}
