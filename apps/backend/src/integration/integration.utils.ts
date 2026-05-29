export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, '')
    .replace(/[^a-z0-9\u0400-\u04FF\u0980-\u09FF]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 200);
}

export function markdownToHtml(markdown: string): string {
  if (!markdown.trim()) return '<p></p>';
  if (/<[a-z][\s\S]*>/i.test(markdown)) {
    return markdown;
  }

  let html = markdown;
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\n\n+/g, '</p><p>');
  html = `<p>${html}</p>`;
  html = html.replace(/<p><h/g, '<h').replace(/<\/h(\d)><\/p>/g, '</h$1>');
  return html;
}

export async function ensureUniqueSlug(
  prisma: { post: { findUnique: (args: { where: { slug: string } }) => Promise<unknown | null> } },
  baseSlug: string,
  excludeId?: string,
): Promise<string> {
  let slug = baseSlug || 'post';
  let n = 1;
  while (true) {
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (!existing || (excludeId && (existing as { id: string }).id === excludeId)) {
      return slug;
    }
    n += 1;
    slug = `${baseSlug}-${n}`;
  }
}
