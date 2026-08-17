'use client';

import Giscus from '@giscus/react';
import { useEffect, useState } from 'react';

type GiscusTheme = 'noborder_light' | 'noborder_dark';

export default function GiscusComment() {
  const [theme, setTheme] = useState<GiscusTheme>('noborder_light');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setTheme(mq.matches ? 'noborder_dark' : 'noborder_light');
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

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
      theme={theme}
      lang="en"
    />
  );
}
