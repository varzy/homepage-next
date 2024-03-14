import { CronJob } from 'cron';
import { SITE_CONFIG } from '@/site.config';
import { getAllPagesWithMeta } from '@/app/(blog)/_lib/notion-handler';

export const notionImagesAliveCron = new CronJob(
  '10 * * * * *', // cronTime
  async function() {
    console.log(`[keepNotionImageAliveCron] Ready to refresh pages...`);
    const allPages = await getAllPagesWithMeta({
      database_id: SITE_CONFIG.notionDatabaseId,
      filter: {
        and: [
          { property: 'status', select: { equals: 'Published' } },
          { property: 'type', select: { equals: 'Post' } }
        ]
      }
    });

    allPages.forEach(page => {
      fetch(`https://varzy.me/posts/${page.slug}`).catch(e => {
        console.error(e);
        return;
      });
      console.log(`[keepNotionImageAliveCron] /posts/${page.slug} has been refreshed.`);
    });

    console.log(`[keepNotionImageAliveCron] All pages has been fetched at ${notionImagesAliveCron.lastDate()}. Next time: ${notionImagesAliveCron.nextDate()}`);
  }, // onTick
  null, // onComplete
  false, // start
  'Asia/Shanghai' // timeZone
);

export const keepNotionImagesAlive = () => {
  if (!notionImagesAliveCron.running) notionImagesAliveCron.start();

}
// job.start() is optional here because of the fourth parameter set to true.
