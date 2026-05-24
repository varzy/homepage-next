const IMAGE_REGEX = /!\[([^\]]*)\]\(([^)]+)\)/g;

export function extractImagesFromMdx(content: string): {
  images: string[];
  cleanContent: string;
} {
  const images: string[] = [];

  const withoutImages = content.replace(IMAGE_REGEX, (_, _alt, url: string) => {
    images.push(url.trim());
    return '';
  });

  // Collapse 3+ consecutive newlines into 2 (one blank line)
  const cleanContent = withoutImages.replace(/\n{3,}/g, '\n\n').trim();

  return { images, cleanContent };
}

export function formatRelativeTime(dateStr: string, now: Date = new Date()): string {
  const past = new Date(dateStr);
  if (Number.isNaN(past.getTime())) return '';

  const diffMs = now.getTime() - past.getTime();
  if (diffMs < 60_000) return '刚刚';

  const totalMinutes = Math.floor(diffMs / 60_000);
  if (totalMinutes < 60) return `${totalMinutes} 分钟前`;

  const totalHours = Math.floor(totalMinutes / 60);
  if (totalHours < 24) return `${totalHours} 小时前`;

  const totalDays = Math.floor(totalHours / 24);
  if (totalDays < 30) {
    const remainingHours = totalHours - totalDays * 24;
    return remainingHours > 0 ? `${totalDays} 天 ${remainingHours} 小时前` : `${totalDays} 天前`;
  }

  let years = now.getFullYear() - past.getFullYear();
  let months = now.getMonth() - past.getMonth();
  let days = now.getDate() - past.getDate();

  if (days < 0) {
    months -= 1;
    const daysInPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    days += daysInPrevMonth;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years >= 1) {
    return months > 0 ? `${years} 年 ${months} 个月前` : `${years} 年前`;
  }
  return days > 0 ? `${months} 个月 ${days} 天前` : `${months} 个月前`;
}
