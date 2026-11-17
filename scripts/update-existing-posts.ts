/**
 * Mavjud maqolalarning matnini yangilash (slug boʻyicha).
 *
 * Manba: content/posts/mavjud-sahifalar.json
 * Yangilanadigan maydonlar: title_uz, title_ru, excerpt_uz, excerpt_ru, body_uz, body_ru.
 * Slug, muqova, toifa, muallif va chop etilgan sana oʻzgarmaydi.
 * Maqola matnining boshidagi mavjud rasm saqlanadi va ikkala til matnining boshiga qoʻyiladi
 * (ruscha matndagi vaqtinchalik placehold.co rasmi oʻrniga ham).
 *
 * Matn ichidagi yangi rasmlar: matnda https://a.acoustic.uz/uploads/maqola-<nom> manzili uchrasa,
 * content/posts/rasmlar/<nom> fayli saytning uploads papkasiga maqola-<nom> nomi bilan koʻchiriladi
 * (--apply rejimida, baza yangilanishidan oldin). Uploads papkasi backend bilan bir xil qoidada
 * aniqlanadi: UPLOADS_DIR (muhit yoki apps/backend/.env), boʻlmasa apps/backend/uploads.
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

function imageSrc(imageTag: string | null): string {
  return ((imageTag || '').match(/src\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
}

function withLeadImage(body: string, imageTag: string | null, alt: string, keepExistingAlt: boolean): string {
  if (!imageTag) return body;
  // Yangi matnning oʻzida shu rasm bor boʻlsa (masalan, matn boshiga qoʻyilgan yangi rasm), ikki marta qoʻyilmaydi.
  const src = imageSrc(imageTag);
  if (src && body.includes(src)) return body;
  const safeAlt = alt.replace(/"/g, '&quot;');
  const altPattern = /\salt\s*=\s*(?:"[^"]*"|'[^']*')/i;
  let tag = imageTag;
  if (!altPattern.test(tag)) {
    tag = tag.replace(/<img/i, `<img alt="${safeAlt}"`);
  } else if (!keepExistingAlt) {
    tag = tag.replace(altPattern, ` alt="${safeAlt}"`);
  }
  return `<p>${tag}</p>\n${body}`;
}

const ASSET_URL = /https:\/\/a\.acoustic\.uz\/uploads\/(maqola-[A-Za-z0-9._-]+)/g;
const ASSET_SOURCE_DIR = path.join(__dirname, '..', 'content', 'posts', 'rasmlar');

/** Backend bilan bir xil qoida: UPLOADS_DIR mavjud papka boʻlsa oʻsha, aks holda apps/backend/uploads. */
function resolveUploadsDir(): string {
  const backendDir = path.join(__dirname, '..', 'apps', 'backend');
  let dir = (process.env.UPLOADS_DIR || '').trim();
  if (!dir) {
    try {
      const env = fs.readFileSync(path.join(backendDir, '.env'), 'utf8');
      const line = env.split(/\r?\n/).find((l) => /^\s*UPLOADS_DIR\s*=/.test(l));
      if (line) dir = line.replace(/^\s*UPLOADS_DIR\s*=\s*/, '').trim().replace(/^["']|["']$/g, '');
    } catch {
      // .env yoʻq: standart papka ishlatiladi
    }
  }
  if (dir) {
    const resolved = path.isAbsolute(dir) ? dir : path.resolve(backendDir, dir);
    if (fs.existsSync(resolved)) return resolved;
  }
  return path.join(backendDir, 'uploads');
}

interface Asset {
  name: string; // uploads papkasidagi nomi: maqola-<nom>
  source: string; // repozitoriydagi manba fayl
  target: string;
  state: 'yangi' | 'bir xil' | 'yangilanadi';
}

function sameFile(a: string, b: string): boolean {
  const sa = fs.statSync(a);
  const sb = fs.statSync(b);
  return sa.size === sb.size && fs.readFileSync(a).equals(fs.readFileSync(b));
}

function collectAssets(items: PostContent[], uploadsDir: string): Asset[] {
  const names = new Set<string>();
  for (const item of items) {
    for (const body of [item.body_uz, item.body_ru]) {
      for (const match of body.matchAll(ASSET_URL)) names.add(match[1]);
    }
  }
  return [...names].sort().map((name) => {
    const source = path.join(ASSET_SOURCE_DIR, name.replace(/^maqola-/, ''));
    if (!fs.existsSync(source)) {
      throw new Error(`Rasm manbasi topilmadi: ${source}`);
    }
    const target = path.join(uploadsDir, name);
    const state = !fs.existsSync(target) ? 'yangi' : sameFile(source, target) ? 'bir xil' : 'yangilanadi';
    return { name, source, target, state };
  });
}

const FIELDS = ['title_uz', 'title_ru', 'excerpt_uz', 'excerpt_ru', 'body_uz', 'body_ru'] as const;

const prisma = new PrismaClient();

async function main() {
  const apply = process.argv.includes('--apply');
  const contentFile = path.join(__dirname, '..', 'content', 'posts', 'mavjud-sahifalar.json');
  const items: PostContent[] = JSON.parse(fs.readFileSync(contentFile, 'utf8'));

  console.log(`Rejim: ${apply ? 'QOʻLLASH' : 'SINOV (hech narsa yozilmaydi)'}`);
  console.log(`Manba: ${contentFile} (${items.length} ta maqola)`);

  const uploadsDir = resolveUploadsDir();
  const assets = collectAssets(items, uploadsDir);
  const leadFiles: string[] = [];
  console.log(`Uploads papkasi: ${uploadsDir}${fs.existsSync(uploadsDir) ? '' : ' (YOʻQ)'}`);
  console.log(`Matn ichidagi rasmlar: ${assets.length} ta fayl\n`);

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
    const leadSrc = imageSrc(leadImage);
    if (/\/uploads\//.test(leadSrc) && !/\/uploads\/maqola-/.test(leadSrc)) {
      leadFiles.push(path.basename(leadSrc.split('?')[0]));
    }
    const bodyUz = withLeadImage(item.body_uz, leadImage, item.image_alt_uz || item.title_uz, true);
    const bodyRu = withLeadImage(item.body_ru, leadImage, item.image_alt_ru || item.title_ru, false);
    found.push({ item, before, bodyUz, bodyRu });
    const oldUz = String(post.body_uz || '').length;
    const oldRu = String(post.body_ru || '').length;
    console.log(`${item.source}  ${item.slug}`);
    console.log(`   sarlavha: "${post.title_uz}" -> "${item.title_uz}"`);
    console.log(`   matn uz: ${oldUz} -> ${bodyUz.length} belgi, ru: ${oldRu} -> ${bodyRu.length} belgi`);
    console.log(`   boshidagi rasm: ${leadImage ? 'saqlanadi' : 'yoʻq'}`);
  }

  console.log(`\nTopildi: ${found.length}, topilmadi: ${missing.length}`);

  if (assets.length > 0) {
    console.log('\nRasm fayllari:');
    for (const asset of assets) {
      console.log(`   ${asset.state.padEnd(11)} ${asset.name}`);
    }
    // Papka toʻgʻriligini tekshirish: maqolalardagi mavjud rasmlardan kamida bittasi shu papkada turishi kerak.
    if (!fs.existsSync(uploadsDir)) {
      throw new Error(`Uploads papkasi topilmadi: ${uploadsDir}. UPLOADS_DIR ni koʻrsating.`);
    }
    if (leadFiles.length > 0 && !leadFiles.some((file) => fs.existsSync(path.join(uploadsDir, file)))) {
      throw new Error(
        `Uploads papkasi notoʻgʻri koʻrinadi: maqolalardagi mavjud rasmlar (${leadFiles[0]} va boshqalar) ` +
          `${uploadsDir} ichida yoʻq. Toʻgʻri papkani UPLOADS_DIR orqali koʻrsating.`,
      );
    }
  }

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

  // Avval rasmlar koʻchiriladi: fayl yozilmasa, baza yangilanmaydi.
  let copied = 0;
  for (const asset of assets) {
    if (asset.state === 'bir xil') continue;
    fs.copyFileSync(asset.source, asset.target);
    fs.chmodSync(asset.target, 0o644);
    if (!sameFile(asset.source, asset.target)) {
      throw new Error(`Rasm toʻliq koʻchirilmadi: ${asset.target}`);
    }
    copied += 1;
  }
  if (assets.length > 0) {
    console.log(`Rasmlar: ${copied} ta koʻchirildi, ${assets.length - copied} ta allaqachon joyida.`);
  }

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
