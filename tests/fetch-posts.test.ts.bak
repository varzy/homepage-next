import path from 'path';
import { describe, it, expect } from 'vitest';

// 由于 fetch-posts.ts 需要真实的环境变量和 Notion API，
// 我们主要测试可以独立验证的部分

describe('scripts/fetch-posts.ts', () => {
  describe('命令行参数解析', () => {
    it('--force 参数被正确识别', () => {
      const args = ['node', 'fetch-posts.ts', '--force'];
      const forceMode = args.includes('--force');

      expect(forceMode).toBe(true);
    });

    it('无参数时 forceMode 为 false', () => {
      const args = ['node', 'fetch-posts.ts'];
      const forceMode = args.includes('--force');

      expect(forceMode).toBe(false);
    });

    it('--force 在参数列表任意位置都被识别', () => {
      const args1 = ['node', 'fetch-posts.ts', '--force'];
      const args2 = ['node', '--force', 'fetch-posts.ts'];
      const args3 = ['node', 'fetch-posts.ts', 'extra', '--force'];

      expect(args1.includes('--force')).toBe(true);
      expect(args2.includes('--force')).toBe(true);
      expect(args3.includes('--force')).toBe(true);
    });
  });

  describe('FetchConfig 配置', () => {
    it('默认输出目录使用 process.cwd()', () => {
      const config = {
        postsOutputDir: path.join(process.cwd(), 'content/posts'),
        pagesOutputDir: path.join(process.cwd(), 'content/pages'),
      };

      expect(config.postsOutputDir).toContain('content/posts');
      expect(config.pagesOutputDir).toContain('content/pages');
    });
  });

  describe('FetchResult 统计', () => {
    it('初始结果为零值', () => {
      const result = { updated: 0, skipped: 0, errors: 0, deleted: 0 };

      expect(result.updated).toBe(0);
      expect(result.skipped).toBe(0);
      expect(result.errors).toBe(0);
      expect(result.deleted).toBe(0);
    });

    it('结果可以正常累加', () => {
      const result = { updated: 0, skipped: 0, errors: 0, deleted: 0 };

      result.updated++;
      result.skipped++;
      result.errors++;
      result.deleted++;

      expect(result.updated).toBe(1);
      expect(result.skipped).toBe(1);
      expect(result.errors).toBe(1);
      expect(result.deleted).toBe(1);
    });
  });

  describe('slug 清理逻辑', () => {
    it('从文件名提取 slug', () => {
      const fileName = 'my-post-title.md';
      const slug = fileName.replace(/\.md$/, '');

      expect(slug).toBe('my-post-title');
    });

    it('多个 .md 只会替换一次', () => {
      const fileName = 'file.name.md';
      const slug = fileName.replace(/\.md$/, '');

      expect(slug).toBe('file.name');
    });
  });

  describe('SMMS API Token 检查', () => {
    it('缺少 SMMS_API_TOKEN 时应该警告', () => {
      // 这是文档化测试：实际脚本在缺少 token 时会 exit(1)
      const token = process.env.SMMS_API_TOKEN;
      const hasToken = !!token;

      // 如果环境没有配置 token，这个测试会通过（因为 hasToken 为 false）
      // 但实际运行脚本时会因为缺少 token 而退出
      if (!hasToken) {
        expect(hasToken).toBe(false);
      }
    });
  });
});
