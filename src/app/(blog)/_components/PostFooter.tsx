'use client';

import Giscus from '@giscus/react';
import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Comments() {
  const [isShowComments, setIsShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  function handleGiscusMessageEvent(event: MessageEvent) {
    console.log('handleGiscusMessageEvent');
    console.log(event);
    if (event.origin !== 'https://giscus.app') return;
    if (!(typeof event.data === 'object' && event.data.giscus)) return;
    const giscusData = event.data.giscus;
    if (!giscusData.discussion) return;

    const totalCommentCount = giscusData.discussion.totalCommentCount;
    console.log(totalCommentCount);
    setCommentCount(totalCommentCount);
  }

  useEffect(() => {
    window.addEventListener('message', handleGiscusMessageEvent);
    return () => {
      window.removeEventListener('message', handleGiscusMessageEvent);
    };
  });

  return (
    <div className="mt-20">
      <div className="flex items-center justify-between font-black">
        <div className="cursor-pointer">
          {!isShowComments && <span onClick={() => setIsShowComments(true)}>评论 ({commentCount})</span>}
        </div>
        <div className="space-x-4">
          <span className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            ⭡ 顶部
          </span>
          <Link href="/sponsor">£ 赞赏</Link>
        </div>
      </div>

      <div className={clsx('mt-6', isShowComments ? 'block' : 'hidden')}>
        <Giscus
          id="comments"
          repo="varzy/homepage-comments"
          repoId="MDEwOlJlcG9zaXRvcnk0MDUzODQyMDA="
          category="Comments"
          categoryId="DIC_kwDOGCmsCM4Cu6iH"
          mapping="pathname"
          reactionsEnabled="0"
          emitMetadata="1"
          inputPosition="top"
          theme="noborder_light"
          lang="en"
        />
      </div>
    </div>
  );
}
