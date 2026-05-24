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
