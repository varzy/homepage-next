'use client';

import Giscus from '@giscus/react';

export default function Comments() {
  return (
    <div className="mt-14">
      <Giscus
        id="comments"
        repo="varzy/homepage-comments"
        repoId="MDEwOlJlcG9zaXRvcnk0MDUzODQyMDA="
        category="Comments"
        categoryId="DIC_kwDOGCmsCM4Cu6iH"
        mapping="pathname"
        reactionsEnabled="0"
        emitMetadata="0"
        inputPosition="bottom"
        theme="noborder_light"
        lang="en"
      />
    </div>
  );
}
