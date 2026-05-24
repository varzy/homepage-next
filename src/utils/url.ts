export function safeDecodeTag(raw: string): string {
  try {
    const once = decodeURIComponent(raw);
    return once.includes('%') ? decodeURIComponent(once) : once;
  } catch {
    return raw;
  }
}
