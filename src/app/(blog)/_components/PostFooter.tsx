'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import GiscusComment from '@/app/_components/GiscusComment';

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
    <section className="mt-20" aria-label="评论">
      <div className="flex items-center justify-between font-extrabold">
        <div className="cursor-pointer">
          {!isShowComments && (
            <button
              type="button"
              aria-expanded={isShowComments}
              aria-controls="giscus-comments"
              onClick={() => setIsShowComments(true)}
              className="g-plain-button"
            >
              评论 ({commentCount})
            </button>
          )}
        </div>
        <div className="space-x-4">
          <button
            type="button"
            className="g-plain-button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            ⭡ 顶部
          </button>
          <Link href="/sponsor">£ 赞赏</Link>
        </div>
      </div>

      <div id="giscus-comments" className={clsx('mt-4', isShowComments ? 'block' : 'hidden')}>
        <GiscusComment />
      </div>
    </section>
  );
}
