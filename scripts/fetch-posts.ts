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
      outputDir: path.join(process.cwd(), 'content/posts'),
    };

    if (!this.config.notionDatabaseId || !this.config.notionApiSecret) {
      throw new Error('Missing required environment variables: NOTION_DATABASE_ID, NOTION_API_SECRET');
    }

    this.converter = new NotionToMDXConverter(this.config.notionApiSecret);
    this.forceMode = forceMode;
  }

  async fetch(): Promise<FetchResult> {
    console.log(`🚀 Starting to fetch posts from Notion${this.forceMode ? ' (FORCE MODE)' : ''}...`);

    const result: FetchResult = { updated: 0, skipped: 0, errors: 0 };

    try {
      // 确保输出目录存在
      this.ensureOutputDirectory();

      // 获取所有文章
      const allPosts = await this.converter.getAllPosts(this.config.notionDatabaseId);
      console.log(`📚 Found ${allPosts.length} published posts`);

      // 筛选需要更新的文章
      const postsToUpdate = this.filterPostsToUpdate(allPosts);
      console.log(`🔄 Posts to update: ${postsToUpdate.length}`);

      if (postsToUpdate.length === 0 && !this.forceMode) {
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

      console.log(
        `🎉 Fetch completed! Updated: ${result.updated}, Skipped: ${result.skipped}, Errors: ${result.errors}`,
      );
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

  private filterPostsToUpdate(posts: PostMetadata[]): PostMetadata[] {
    // 如果是强制模式，返回所有文章
    if (this.forceMode) {
      console.log('🔥 Force mode enabled - will update ALL posts');
      return posts;
    }

    return posts.filter((post) => {
      // 检查本地文件是否存在
      const localFilePath = path.join(this.config.outputDir, `${post.slug}.md`);
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

  private async processPost(post: PostMetadata): Promise<void> {
    try {
      // 转换 Notion 页面为 Markdown
      const markdownContent = await this.converter.convertToMDX(post.notion_id);

      // 先更新 Notion 中的 blog_last_fetched_time
      await this.converter.updateBlogLastFetchedTime(post.notion_id);

      // 创建更新后的元数据对象（包含当前时间作为 blog_last_fetched_time）
      const updatedPost: PostMetadata = {
        ...post,
        blog_last_fetched_time: new Date().toISOString(),
      };

      // 生成 MD 文件内容（使用更新后的元数据）
      const mdxContent = generateMDXContent(updatedPost, markdownContent);

      // 保存到本地文件
      const filePath = path.join(this.config.outputDir, `${post.slug}.md`);
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
    // 解析命令行参数
    const args = process.argv.slice(2);
    const forceMode = args.includes('--force');
    console.log(`🔥 Force mode: ${forceMode}`);

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
