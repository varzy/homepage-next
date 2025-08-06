#!/usr/bin/env tsx

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { NotionToMDXConverter, generateMDXContent } from './notion-to-mdx';
import { FetchConfig, PostMetadata, FetchResult } from './types';

class PostsFetcher {
  private config: FetchConfig;
  private converter: NotionToMDXConverter;

  constructor() {
    this.config = {
      notionDatabaseId: process.env.NOTION_DATABASE_ID || '',
      notionApiSecret: process.env.NOTION_API_SECRET || '',
      outputDir: path.join(process.cwd(), 'content/posts'),
      lastFetchFile: path.join(process.cwd(), '.last-fetch'),
    };

    if (!this.config.notionDatabaseId || !this.config.notionApiSecret) {
      throw new Error('Missing required environment variables: NOTION_DATABASE_ID, NOTION_API_SECRET');
    }

    this.converter = new NotionToMDXConverter(this.config.notionApiSecret);
  }

  async fetch(): Promise<FetchResult> {
    console.log('🚀 Starting to fetch posts from Notion...');

    const result: FetchResult = { updated: 0, skipped: 0, errors: 0 };

    try {
      // 确保输出目录存在
      this.ensureOutputDirectory();

      // 读取上次拉取时间
      const lastFetchTime = this.readLastFetchTime();
      console.log(`📅 Last fetch time: ${lastFetchTime || 'Never'}`);

      // 获取所有文章
      const allPosts = await this.converter.getAllPosts(this.config.notionDatabaseId);
      console.log(`📚 Found ${allPosts.length} published posts`);

      // 筛选需要更新的文章
      const postsToUpdate = this.filterPostsToUpdate(allPosts, lastFetchTime);
      console.log(`🔄 Posts to update: ${postsToUpdate.length}`);

      if (postsToUpdate.length === 0) {
        console.log('✅ All posts are up to date!');
        return result;
      }

      // 批量处理更新
      for (const post of postsToUpdate) {
        try {
          await this.processPost(post);
          result.updated++;
          console.log(`✅ Updated: ${post.title}`);
        } catch (error) {
          result.errors++;
          console.error(`❌ Failed to update ${post.title}:`, error);
        }
      }

      // 更新拉取时间戳
      this.saveLastFetchTime();

      console.log(`🎉 Fetch completed! Updated: ${result.updated}, Errors: ${result.errors}`);

    } catch (error) {
      console.error('💥 Fatal error during fetch:', error);
      throw error;
    }

    return result;
  }

  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
      console.log(`📁 Created output directory: ${this.config.outputDir}`);
    }
  }

  private readLastFetchTime(): string | null {
    try {
      if (fs.existsSync(this.config.lastFetchFile)) {
        return fs.readFileSync(this.config.lastFetchFile, 'utf-8').trim();
      }
    } catch (error) {
      console.warn('⚠️ Could not read last fetch time:', error);
    }
    return null;
  }

  private saveLastFetchTime(): void {
    const now = new Date().toISOString();
    try {
      fs.writeFileSync(this.config.lastFetchFile, now);
      console.log(`💾 Saved last fetch time: ${now}`);
    } catch (error) {
      console.error('❌ Could not save last fetch time:', error);
    }
  }

  private filterPostsToUpdate(posts: PostMetadata[], lastFetchTime: string | null): PostMetadata[] {
    return posts.filter(post => {
      // 如果没有上次拉取时间，拉取所有文章
      if (!lastFetchTime) return true;

      // 检查文章是否在上次拉取后有更新
      const postEditTime = new Date(post.last_edited_time);
      const lastFetch = new Date(lastFetchTime);
      const wasUpdated = postEditTime > lastFetch;

      // 检查本地文件是否存在
      const localFilePath = path.join(this.config.outputDir, `${post.slug}.mdx`);
      const fileExists = fs.existsSync(localFilePath);

      return wasUpdated || !fileExists;
    });
  }

  private async processPost(post: PostMetadata): Promise<void> {
    try {
      // 转换 Notion 页面为 Markdown
      const markdownContent = await this.converter.convertToMDX(post.notion_id);

      // 生成 MDX 文件内容
      const mdxContent = generateMDXContent(post, markdownContent);

      // 保存到本地文件
      const filePath = path.join(this.config.outputDir, `${post.slug}.mdx`);
      fs.writeFileSync(filePath, mdxContent, 'utf-8');

    } catch (error) {
      console.error(`Error processing post ${post.title}:`, error);
      throw error;
    }
  }
}

// 主执行函数
async function main() {
  try {
    const fetcher = new PostsFetcher();
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
