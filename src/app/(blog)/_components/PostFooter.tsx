'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import GiscusComment from './GiscusComment';

export default function Comments() {
  const [isShowComments, setIsShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  function handleGiscusMessageEvent(event: MessageEvent) {
    if (event.origin !== 'https://giscus.app') return;
    if (!(typeof event.data === 'object' && event.data.giscus)) return;

    const giscusData = event.data.giscus;
    if (!giscusData.discussion) return;

    const totalCommentCount = giscusData.discussion?.totalCommentCount;
    if (totalCommentCount) setCommentCount(totalCommentCount);
  }

  useEffect(() => {
    window.addEventListener('message', handleGiscusMessageEvent);
    return () => {
      window.removeEventListener('message', handleGiscusMessageEvent);
    };
  });

  return (
    <div className="mt-20">
      <div className="flex items-center justify-between font-extrabold">
        <div className="cursor-pointer">
          {!isShowComments && (
            <span onClick={() => setIsShowComments(true)}>评论 ({commentCount})</span>
          )}
        </div>
        <div className="space-x-4">
          <span
            className="cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ⭡ 顶部
          </span>
          <Link href="/sponsor">£ 赞赏</Link>
        </div>
      </div>

      <div className={clsx('mt-4', isShowComments ? 'block' : 'hidden')}>
        <GiscusComment />
      </div>
    </div>
  );
}
