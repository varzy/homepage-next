#!/usr/bin/env tsx

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { NotionToMDXConverter, generateMDXContent } from './notion-to-md';
import { FetchConfig, PostMetadata, FetchResult } from './types';

class PostsFetcher {
  private config: FetchConfig;
  private converter: NotionToMDXConverter;
  private forceMode: boolean;

  constructor(forceMode: boolean = false) {
    this.config = {
      notionDatabaseId: process.env.NOTION_DATABASE_ID || '',
      notionApiSecret: process.env.NOTION_API_SECRET || '',
      postsOutputDir: path.join(process.cwd(), 'content/posts'),
      pagesOutputDir: path.join(process.cwd(), 'content/pages'),
    };

    if (!this.config.notionDatabaseId || !this.config.notionApiSecret) {
      throw new Error(
        'Missing required environment variables: NOTION_DATABASE_ID, NOTION_API_SECRET',
      );
    }

    // 图片上传功能默认开启，无法禁用
    this.converter = new NotionToMDXConverter(this.config.notionApiSecret);
    this.forceMode = forceMode;
  }

  async fetch(): Promise<FetchResult> {
    console.log(
      `🚀 Starting to fetch posts from Notion${this.forceMode ? ' (FORCE MODE)' : ''}...`,
    );
    console.log(`📷 Image upload to SM.MS is ENABLED`);

    const result: FetchResult = { updated: 0, skipped: 0, errors: 0, deleted: 0 };

    try {
      // 确保输出目录存在（posts/pages）
      this.ensureDirectory(this.config.postsOutputDir);
      this.ensureDirectory(this.config.pagesOutputDir);

      // 获取所有 Published 文章（Post）与页面（Page）
      const [allPosts, allPages] = await Promise.all([
        this.converter.getAllPosts(this.config.notionDatabaseId),
        this.converter.getAllPages(this.config.notionDatabaseId),
      ]);
      console.log(`📚 Found ${allPosts.length} published posts`);
      console.log(`📄 Found ${allPages.length} published pages`);
      const publishedPostSlugs = new Set(allPosts.map((p) => p.slug).filter(Boolean));
      const publishedPageSlugs = new Set(allPages.map((p) => p.slug).filter(Boolean));

      // 筛选需要更新的文章
      const postsToUpdate = this.filterItemsToUpdate(allPosts, this.config.postsOutputDir);
      const pagesToUpdate = this.filterItemsToUpdate(allPages, this.config.pagesOutputDir);
      console.log(`🔄 Posts to update: ${postsToUpdate.length}`);
      console.log(`🔁 Pages to update: ${pagesToUpdate.length}`);

      if (postsToUpdate.length === 0 && pagesToUpdate.length === 0 && !this.forceMode) {
        // 即便没有需要更新的内容，也要执行一次孤儿文件清理（文章与页面）
        this.cleanupOrphanedLocalFiles(publishedPostSlugs, this.config.postsOutputDir, result);
        this.cleanupOrphanedLocalFiles(publishedPageSlugs, this.config.pagesOutputDir, result);
        console.log('✅ All contents are up to date!');
        return result;
      }

      // 批量处理更新（统一按集合配置）
      const collectionsToUpdate: Array<{ label: string; items: PostMetadata[]; dir: string }> = [
        { label: 'post', items: postsToUpdate, dir: this.config.postsOutputDir },
        { label: 'page', items: pagesToUpdate, dir: this.config.pagesOutputDir },
      ];
      for (const { label, items, dir } of collectionsToUpdate) {
        for (const item of items) {
          try {
            await this.processItem(item, dir);
            result.updated++;
            console.log(`✅ Updated ${label}: ${item.title}`);
          } catch (error) {
            result.errors++;
            console.error(`❌ Failed to update ${label} ${item.title}:`, error);
          }
        }
      }

      // 清理不存在于当前 Published 列表中的本地文件（包含已归档和 slug 改名的旧文件）
      const cleanupCollections: Array<{ slugs: Set<string>; dir: string }> = [
        { slugs: publishedPostSlugs, dir: this.config.postsOutputDir },
        { slugs: publishedPageSlugs, dir: this.config.pagesOutputDir },
      ];
      for (const { slugs, dir } of cleanupCollections) {
        this.cleanupOrphanedLocalFiles(slugs, dir, result);
      }

      console.log(
        `🎉 Fetch completed! Updated: ${result.updated}, Deleted: ${result.deleted}, Skipped: ${result.skipped}, Errors: ${result.errors}`,
      );
    } catch (error) {
      console.error('💥 Fatal error during fetch:', error);
      throw error;
    }

    return result;
  }

  private ensureDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  }

  private filterItemsToUpdate(posts: PostMetadata[], postsOutputDir: string): PostMetadata[] {
    // 如果是强制模式，返回所有文章
    if (this.forceMode) {
      console.log('🔥 Force mode enabled - will update ALL posts');
      return posts;
    }

    return posts.filter((post) => {
      // 检查本地文件是否存在
      const localFilePath = path.join(postsOutputDir, `${post.slug}.md`);
      const fileExists = fs.existsSync(localFilePath);

      // 如果本地文件不存在，肯定需要拉取
      if (!fileExists) {
        console.log(`📥 New post: ${post.title}`);
        return true;
      }

      // 如果没有 blog_last_fetched_time，说明从未拉取过，需要更新
      if (!post.blog_last_fetched_time) {
        console.log(`🔄 First time fetch: ${post.title}`);
        return true;
      }

      // 比较最后编辑时间和最后拉取时间
      const lastEditTime = new Date(post.last_edited_time);
      const lastFetchTime = new Date(post.blog_last_fetched_time);

      const needsUpdate = lastEditTime > lastFetchTime;

      if (needsUpdate) {
        console.log(`🔄 Updated since last fetch: ${post.title}`);
        console.log(`   Last edited: ${post.last_edited_time}`);
        console.log(`   Last fetched: ${post.blog_last_fetched_time}`);
      }

      return needsUpdate;
    });
  }

  private async processItem(post: PostMetadata, postsOutputDir: string): Promise<void> {
    try {
      console.log(`📄 Processing post: ${post.title}`);

      // 转换 Notion 页面为 Markdown（包含图片处理）
      const { content: markdownContent, imageStats } = await this.converter.convertToMDX(
        post.page_id,
        post.slug,
      );

      // 输出图片处理统计
      if (imageStats) {
        if (imageStats.total > 0) {
          console.log(`📊 Image processing stats for ${post.title}:`);
          console.log(`   Total images: ${imageStats.total}`);
          console.log(`   Processed: ${imageStats.processed}`);
          console.log(`   Skipped: ${imageStats.skipped}`);
          console.log(`   Errors: ${imageStats.errors}`);
        } else {
          console.log(`📷 No images found in ${post.title}`);
        }
      }

      // 先更新 Notion 中的 blog_last_fetched_time
      await this.converter.updateBlogLastFetchedTime(post.page_id);

      // 创建更新后的元数据对象（包含当前时间作为 blog_last_fetched_time）
      const updatedPost: PostMetadata = {
        ...post,
        blog_last_fetched_time: new Date().toISOString(),
      };

      // 生成 MD 文件内容（使用更新后的元数据）
      const mdxContent = generateMDXContent(updatedPost, markdownContent);

      // 保存到本地文件
      const filePath = path.join(postsOutputDir, `${post.slug}.md`);
      fs.writeFileSync(filePath, mdxContent, 'utf-8');

      console.log(`✅ Successfully processed: ${post.title}`);
    } catch (error) {
      console.error(`❌ Error processing post ${post.title}:`, error);
      throw error;
    }
  }

  private cleanupOrphanedLocalFiles(
    publishedSlugs: Set<string>,
    dir: string,
    result: FetchResult,
  ): void {
    try {
      const files = fs.readdirSync(dir);
      let localChecked = 0;
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        localChecked++;
        const slug = file.replace(/\.md$/, '');
        if (!publishedSlugs.has(slug)) {
          const filePath = path.join(dir, file);
          try {
            fs.unlinkSync(filePath);
            result.deleted++;
            console.log(`🗑️ Deleted orphaned file: ${file}`);
          } catch (err) {
            result.errors++;
            console.error(`❌ Failed to delete orphaned file ${file}:`, err);
          }
        }
      }
      console.log(`🧹 Orphan cleanup checked ${localChecked} files in ${dir}`);
    } catch (err) {
      result.errors++;
      console.error('❌ Failed during orphaned files cleanup:', err);
    }
  }
}

// 主执行函数
async function main() {
  try {
    // 解析命令行参数
    const args = process.argv.slice(2);
    const forceMode = args.includes('--force');

    console.log(`🔥 Force mode: ${forceMode}`);

    // 检查是否配置了 SMMS API Token（图片上传功能总是启用）
    if (!process.env.SMMS_API_TOKEN) {
      console.warn('⚠️ SMMS_API_TOKEN is not set in environment variables');
      console.warn('⚠️ Please set SMMS_API_TOKEN to use image upload feature');
      process.exit(1);
    }

    const fetcher = new PostsFetcher(forceMode);
    await fetcher.fetch();
    process.exit(0);
  } catch (error) {
    console.error('💥 Script failed:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}
