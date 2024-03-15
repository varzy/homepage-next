import {
  composeDatabaseQuery,
  getAllPagesWithMeta,
  getPageBySlug,
  markPageImagesHasBeenUploadedToSmms,
  replaceNotionImageWithSmms,
} from '@/app/(blog)/_lib/notion-handler';
import { notFound } from 'next/navigation';
import { notionToMarkdown } from '@/app/(blog)/_lib/notion-to-markdown';
import PostTag from '@/app/(blog)/_components/PostTag';
import BlogPageContainer from '@/app/(blog)/_components/BlogPageContainer';
import BuyMeACoffee from '@/app/(blog)/_components/BuyMeACoffee';
import { getEmojiFavicon } from '@/utils/favicon';
import Prose from '@/app/(blog)/_components/Prose';

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = params;

  const page = await getPageBySlug(composeDatabaseQuery(), slug);
  if (!page) return {};

  return {
    title: page.title,
    description: page.summary,
    icons: getEmojiFavicon(page.icon),
  };
}

export async function generateStaticParams() {
  const allPosts = await getAllPagesWithMeta(composeDatabaseQuery());
  return allPosts.map((post) => ({ slug: post.slug }));
}

export default async function Post({ params }: PageProps) {
  const { slug } = params;
  console.log(`[posts/[slug]] Current slug: ${slug}`);

  return <>{slug}</>
  // const targetPost = await getPageBySlug(composeDatabaseQuery(), slug);
  // if (!targetPost) notFound();
  //
  // // If post is not ready, run automations for it .
  // // - Replace notion image to smms image.
  // if (!targetPost.isSmmsImages) {
  //   await replaceNotionImageWithSmms(targetPost.id, slug);
  //   await markPageImagesHasBeenUploadedToSmms(targetPost.id);
  // }
  //
  // const mdBlocks = await notionToMarkdown.pageToMarkdown(targetPost.id);
  // const mdString = notionToMarkdown.toMarkdownString(mdBlocks);
  //
  // return (
  //   <BlogPageContainer
  //     pageHero={{
  //       title: targetPost.title,
  //       before: targetPost.dateAmericaStyle,
  //       after: (
  //         <div className="mt-2">
  //           {targetPost.tags.length > 0 && targetPost.tags.map((tag) => <PostTag key={tag} tag={tag} />)}
  //         </div>
  //       ),
  //     }}
  //     extra={targetPost.category === 'Coding' ? <BuyMeACoffee /> : undefined}
  //   >
  //     <Prose markdown={mdString.parent}></Prose>
  //   </BlogPageContainer>
  // );
}
