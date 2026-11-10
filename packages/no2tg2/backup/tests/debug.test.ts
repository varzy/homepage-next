import { describe, expect, it, vi } from 'vitest';

describe('vi.fn chain debug', () => {
  it('mockRejectedValueOnce + mockResolvedValueOnce chain', async () => {
    const fn = vi.fn();
    
    fn.mockRejectedValueOnce(new Error('fail-first'));
    fn.mockResolvedValueOnce('success-second');
    
    // First call
    try {
      await fn('arg1');
    } catch (e) {
      console.log('first call error:', (e as Error).message);
    }
    
    // Second call
    const result = await fn('arg2');
    console.log('second call result:', result);
    
    console.log('call 0 args:', fn.mock.calls[0]);
    console.log('call 1 args:', fn.mock.calls[1]);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
