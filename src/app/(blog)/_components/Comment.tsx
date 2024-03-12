// 'use client'
//
// import { useEffect } from 'react';
// import { retry } from 'next/dist/compiled/@next/font/dist/google/retry';
// import { SITE_CONFIG } from '@/site.config';
//
// export default function Comment() {
//  useEffect(()=> {
//    const script = document.createElement('script')
//    const anchor = document.getElementById('comments')
//    script.setAttribute('src', 'https://utteranc.es/client.js')
//    script.setAttribute('crossorigin', 'anonymous')
//    script.setAttribute('async', true);
//    script.setAttribute('repo', SITE_CONFIG.utterancRepo)
//    script.setAttribute('issue-term', issueTerm)
//    script.setAttribute('theme', theme)
//    anchor.appendChild(script)
//
//    return () => {
//      anchor.innerHTML = '';
//    }
//  })
// }
