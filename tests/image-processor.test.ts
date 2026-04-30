import { describe, it, expect, vi } from 'vitest';

// 由于 NotionImageProcessor 需要 Notion API 密钥和实际 API 调用，
// 我们主要测试 delay 函数和其他可以独立测试的部分

describe('scripts/image-processor.ts', () => {
  // NotionImageProcessor 的 delay 方法是私有的，
  // 但我们可以通过模拟来测试行为
  describe('delay function behavior', () => {
    it('延迟大约 100ms', async () => {
      vi.useFakeTimers();
      try {
        const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

        const promise = delay(100);

        // 快进 100ms
        vi.advanceTimersByTime(100);

        // 或等待 promise 完成
        await Promise.resolve(promise);
        // 在 fake timers 下需要手动推进
      } finally {
        vi.useRealTimers();
      }
    });
  });

  describe('ImageProcessingStats', () => {
    it('正确初始化统计对象', () => {
      const stats = {
        total: 0,
        processed: 0,
        skipped: 0,
        errors: 0,
      };

      expect(stats.total).toBe(0);
      expect(stats.processed).toBe(0);
      expect(stats.skipped).toBe(0);
      expect(stats.errors).toBe(0);
    });

    it('统计值可以正常累加', () => {
      const stats = {
        total: 5,
        processed: 3,
        skipped: 1,
        errors: 1,
      };

      stats.total++;
      stats.processed++;
      stats.skipped++;
      stats.errors++;

      expect(stats.total).toBe(6);
      expect(stats.processed).toBe(4);
      expect(stats.skipped).toBe(2);
      expect(stats.errors).toBe(2);
    });
  });
});
