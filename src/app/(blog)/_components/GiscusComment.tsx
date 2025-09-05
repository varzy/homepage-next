'use client';

import Giscus from '@giscus/react';

export default function GiscusComment() {
  return (
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
  );
}
