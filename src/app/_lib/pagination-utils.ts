export function buildPageSegments(
  count: number,
  perPage: number,
  options?: { keepEmpty?: boolean },
): string[][] {
  if (count === 0) return options?.keepEmpty ? [[]] : [];
  const totalPages = Math.ceil(count / perPage);
  return [[], ...Array.from({ length: totalPages }, (_, i) => [String(i + 1)])];
}

export function buildIndexPageParams(
  count: number,
  perPage: number,
  options?: { keepEmpty?: boolean },
): { page: string[] }[] {
  return buildPageSegments(count, perPage, options).map((page) => ({ page }));
}

export function buildTagPageParams(
  posts: { tags: string[] }[],
  tags: string[],
  perPage: number,
): { tag: string; page: string[] }[] {
  return tags.flatMap((tag) => {
    const count = posts.filter((p) => p.tags.includes(tag)).length;
    return buildPageSegments(count, perPage).map((page) => ({ tag, page }));
  });
}
