export function buildTagPageParams(
  posts: { tags: string[] }[],
  tags: string[],
  perPage: number,
): { tag: string; page: string[] }[] {
  return tags.flatMap((tag) => {
    const count = posts.filter((p) => p.tags.includes(tag)).length;
    if (count === 0) return [];
    const totalPages = Math.ceil(count / perPage);
    return Array.from({ length: totalPages }, (_, i) => ({
      tag,
      page: i === 0 ? [] : [String(i + 1)],
    }));
  });
}
