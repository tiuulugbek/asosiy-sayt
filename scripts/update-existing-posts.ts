/**
 * Mavjud maqolalarning matnini yangilash (slug boʻyicha).
 *
 * Manba: content/posts/mavjud-sahifalar.json
 * Yangilanadigan maydonlar: title_uz, title_ru, excerpt_uz, excerpt_ru, body_uz, body_ru.
 * Slug, muqova, toifa, muallif va chop etilgan sana oʻzgarmaydi.
 * Maqola matnining boshidagi mavjud rasm saqlanadi va ikkala til matnining boshiga qoʻyiladi
 * (ruscha matndagi vaqtinchalik placehold.co rasmi oʻrniga ham).
 *
 * Sinov (hech narsa yozilmaydi):
 *   pnpm --filter @acoustic/backend exec ts-node --transpile-only --project tsconfig.json ../../scripts/update-existing-posts.ts
 * Qoʻllash:
 *   ... ../../scripts/update-existing-posts.ts --apply
 *
 * --apply rejimida avvalgi qiymatlar POSTS_BACKUP_DIR (standart: /var/backups/acoustic)
 * papkasiga posts-before-<vaqt>.json nomi bilan saqlanadi. Nusxa yozilmasa, yangilash bajarilmaydi.
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

interface PostContent {
  source: string;
  slug: string;
  title_uz: string;
  title_ru: string;
  excerpt_uz: string;
  excerpt_ru: string;
  body_uz: string;
  body_ru: string;
  image_alt_uz?: string;
  image_alt_ru?: string;
}

/** Mavjud matndagi birinchi haqiqiy rasm tegini topadi (vaqtinchalik rasmlar hisobga olinmaydi). */
function findLeadImage(...bodies: string[]): string | null {
  for (const body of bodies) {
    const tags = String(body || '').match(/<img[^>]*>/gi) || [];
    for (const tag of tags) {
      const src = (tag.match(/src\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
      if (src && !/placehold\.co/i.test(src)) return tag;
    }
  }
  return null;
}

function withLeadImage(body: string, imageTag: string | null, alt: string): string {
  if (!imageTag) return body;
  const safeAlt = alt.replace(/"/g, '&quot;');
  const tag = /\salt\s*=/i.test(imageTag)
    ? imageTag.replace(/\salt\s*=\s*(["'])[^"']*\1/i, ` alt="${safeAlt}"`)
    : imageTag.replace(/<img/i, `<img alt="${safeAlt}"`);
  return `<p>${tag}</p>\n${body}`;
}

const FIELDS = ['title_uz', 'title_ru', 'excerpt_uz', 'excerpt_ru', 'body_uz', 'body_ru'] as const;

const prisma = new PrismaClient();

async function main() {
  const apply = process.argv.includes('--apply');
  const contentFile = path.join(__dirname, '..', 'content', 'posts', 'mavjud-sahifalar.json');
  const items: PostContent[] = JSON.parse(fs.readFileSync(contentFile, 'utf8'));

  console.log(`Rejim: ${apply ? 'QOʻLLASH' : 'SINOV (hech narsa yozilmaydi)'}`);
  console.log(`Manba: ${contentFile} (${items.length} ta maqola)\n`);

  const found: { item: PostContent; before: Record<string, unknown>; bodyUz: string; bodyRu: string }[] = [];
  const missing: string[] = [];

  for (const item of items) {
    for (const field of FIELDS) {
      if (!item[field] || !item[field].trim()) {
        throw new Error(`${item.slug}: ${field} boʻsh`);
      }
    }
    const post = await prisma.post.findUnique({ where: { slug: item.slug } });
    if (!post) {
      missing.push(item.slug);
      console.log(`TOPILMADI  ${item.slug}`);
      continue;
    }
    const before: Record<string, unknown> = { id: post.id, slug: post.slug };
    for (const field of FIELDS) {
      before[field] = (post as Record<string, unknown>)[field];
    }
    const leadImage = findLeadImage(String(post.body_uz || ''), String(post.body_ru || ''));
    const bodyUz = withLeadImage(item.body_uz, leadImage, item.image_alt_uz || item.title_uz);
    const bodyRu = withLeadImage(item.body_ru, leadImage, item.image_alt_ru || item.title_ru);
    found.push({ item, before, bodyUz, bodyRu });
    const oldUz = String(post.body_uz || '').length;
    const oldRu = String(post.body_ru || '').length;
    console.log(`${item.source}  ${item.slug}`);
    console.log(`   sarlavha: "${post.title_uz}" -> "${item.title_uz}"`);
    console.log(`   matn uz: ${oldUz} -> ${bodyUz.length} belgi, ru: ${oldRu} -> ${bodyRu.length} belgi`);
    console.log(`   boshidagi rasm: ${leadImage ? 'saqlanadi' : 'yoʻq'}`);
  }

  console.log(`\nTopildi: ${found.length}, topilmadi: ${missing.length}`);

  if (!apply) {
    console.log('Sinov tugadi. Qoʻllash uchun --apply bilan qayta ishga tushiring.');
    return;
  }
  if (found.length === 0) {
    console.log('Yangilanadigan maqola yoʻq.');
    return;
  }

  const backupDir = process.env.POSTS_BACKUP_DIR || '/var/backups/acoustic';
  fs.mkdirSync(backupDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `posts-before-${stamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(found.map((f) => f.before), null, 2), { mode: 0o600 });
  console.log(`Avvalgi qiymatlar saqlandi: ${backupFile}`);

  for (const { item, bodyUz, bodyRu } of found) {
    await prisma.post.update({
      where: { slug: item.slug },
      data: {
        title_uz: item.title_uz,
        title_ru: item.title_ru,
        excerpt_uz: item.excerpt_uz,
        excerpt_ru: item.excerpt_ru,
        body_uz: bodyUz,
        body_ru: bodyRu,
      },
    });
    console.log(`YANGILANDI  ${item.slug}`);
  }
  console.log(`\nTayyor: ${found.length} ta maqola yangilandi.`);
}

main()
  .catch((error) => {
    console.error('XATO:', error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
