/**
 * Yangi maqolalarni saytga qoʻshish (slug boʻyicha).
 *
 * Manba: content/posts/yangi-maqolalar.json
 * Har bir maqola: source, slug, section ("patients" yoki "children"), title_uz/ru, excerpt_uz/ru,
 * body_uz/ru va ixtiyoriy cover (content/posts/rasmlar/ ichidagi fayl nomi), cover_alt_uz/ru.
 *
 * Qoidalar:
 * - Slug bazada yoʻq boʻlsa, maqola yaratiladi (postType "article", status "published").
 * - Slug bor boʻlsa, maqolaga tegilmaydi. --update bilan uning sarlavha, qisqa tavsif va matni
 *   yangilanadi; muqova faqat JSON'da cover koʻrsatilgan boʻlsa almashtiriladi.
 * - Toifa: maqolaning boʻlimidagi (section) chop etilgan toifalardan tartib boʻyicha birinchisi.
 *   Boshqasini tanlash: --category-patients=<slug> yoki --category-children=<slug>.
 * - Roʻyxatdagi tartib saqlanadi: birinchi maqola sahifada eng yuqorida chiqadi.
 * - Matndagi /uploads/maqola-<nom> rasmlari va muqova content/posts/rasmlar/ dan uploads papkasiga koʻchiriladi.
 *
 * Sinov (hech narsa yozilmaydi):
 *   pnpm --filter @acoustic/backend exec ts-node --transpile-only --project tsconfig.json ../../scripts/import-new-posts.ts
 * Qoʻllash:
 *   ... ../../scripts/import-new-posts.ts --apply
 * Qoralama sifatida yaratish: --apply --draft
 *
 * --update rejimida oʻzgaradigan maqolalarning avvalgi qiymatlari POSTS_BACKUP_DIR
 * (standart: /var/backups/acoustic) papkasiga saqlanadi.
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

interface NewPost {
  source: string;
  slug: string;
  section: 'patients' | 'children';
  title_uz: string;
  title_ru: string;
  excerpt_uz: string;
  excerpt_ru: string;
  body_uz: string;
  body_ru: string;
  cover?: string;
  cover_alt_uz?: string;
  cover_alt_ru?: string;
}

const REQUIRED = ['title_uz', 'title_ru', 'excerpt_uz', 'excerpt_ru', 'body_uz', 'body_ru'] as const;
const ASSET_URL = /https:\/\/a\.acoustic\.uz\/uploads\/(maqola-[A-Za-z0-9._-]+)/g;
const ASSET_SOURCE_DIR = path.join(__dirname, '..', 'content', 'posts', 'rasmlar');
const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
};

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
  source: string;
  target: string;
  state: 'yangi' | 'bir xil' | 'yangilanadi';
}

function sameFile(a: string, b: string): boolean {
  return fs.statSync(a).size === fs.statSync(b).size && fs.readFileSync(a).equals(fs.readFileSync(b));
}

function collectAssets(items: NewPost[], uploadsDir: string): Asset[] {
  const names = new Set<string>();
  for (const item of items) {
    for (const body of [item.body_uz, item.body_ru]) {
      for (const match of body.matchAll(ASSET_URL)) names.add(match[1]);
    }
    if (item.cover) names.add(`maqola-${item.cover}`);
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

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find((a) => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

const prisma = new PrismaClient();

async function resolveCategory(section: 'patients' | 'children'): Promise<{ id: string; label: string }> {
  const wanted = argValue(`category-${section}`);
  const categories = await prisma.postCategory.findMany({
    where: { section, status: 'published' },
    orderBy: { order: 'asc' },
  });
  if (categories.length === 0) {
    throw new Error(`"${section}" boʻlimida chop etilgan toifa topilmadi.`);
  }
  const chosen = wanted ? categories.find((c) => c.slug === wanted) : categories[0];
  if (!chosen) {
    throw new Error(
      `"${section}" boʻlimida "${wanted}" degan toifa yoʻq. Mavjudlari: ${categories.map((c) => c.slug).join(', ')}`,
    );
  }
  const others = categories.length > 1 ? ` (boʻlimda jami ${categories.length} ta toifa: ${categories.map((c) => c.slug).join(', ')})` : '';
  return { id: chosen.id, label: `${chosen.name_uz} [${chosen.slug}]${others}` };
}

async function ensureCover(item: NewPost, uploadsDir: string): Promise<string | undefined> {
  if (!item.cover) return undefined;
  const name = `maqola-${item.cover}`;
  const url = `/uploads/${name}`;
  const existing = await prisma.media.findFirst({ where: { url } });
  const alt_uz = item.cover_alt_uz || item.title_uz;
  const alt_ru = item.cover_alt_ru || item.title_ru;
  if (existing) {
    if (existing.alt_uz !== alt_uz || existing.alt_ru !== alt_ru) {
      await prisma.media.update({ where: { id: existing.id }, data: { alt_uz, alt_ru } });
    }
    return existing.id;
  }
  const file = path.join(uploadsDir, name);
  const media = await prisma.media.create({
    data: {
      url,
      alt_uz,
      alt_ru,
      filename: name,
      mimeType: MIME[path.extname(name).toLowerCase()] || 'application/octet-stream',
      size: fs.statSync(file).size,
    },
  });
  return media.id;
}

async function main() {
  const apply = process.argv.includes('--apply');
  const update = process.argv.includes('--update');
  const draft = process.argv.includes('--draft');
  const contentFile = path.join(__dirname, '..', 'content', 'posts', 'yangi-maqolalar.json');
  const items: NewPost[] = JSON.parse(fs.readFileSync(contentFile, 'utf8'));

  console.log(`Rejim: ${apply ? 'QOʻLLASH' : 'SINOV (hech narsa yozilmaydi)'}${update ? ', mavjudlari yangilanadi' : ''}${draft ? ', qoralama' : ''}`);
  console.log(`Manba: ${contentFile} (${items.length} ta maqola)`);

  const slugs = new Set<string>();
  for (const item of items) {
    for (const field of REQUIRED) {
      if (!item[field] || !item[field].trim()) throw new Error(`${item.slug}: ${field} boʻsh`);
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) throw new Error(`Slug notoʻgʻri: ${item.slug}`);
    if (slugs.has(item.slug)) throw new Error(`Slug takrorlangan: ${item.slug}`);
    slugs.add(item.slug);
    if (item.section !== 'patients' && item.section !== 'children') {
      throw new Error(`${item.slug}: section "patients" yoki "children" boʻlishi kerak`);
    }
  }
  const covers = items.map((item) => item.cover).filter(Boolean) as string[];
  const repeated = covers.find((cover, i) => covers.indexOf(cover) !== i);
  if (repeated) throw new Error(`Bitta muqova ikki maqolada ishlatilgan: ${repeated}`);

  const uploadsDir = resolveUploadsDir();
  const assets = collectAssets(items, uploadsDir);
  console.log(`Uploads papkasi: ${uploadsDir}${fs.existsSync(uploadsDir) ? '' : ' (YOʻQ)'}`);
  console.log(`Rasm fayllari: ${assets.length} ta`);

  const categories: Record<string, { id: string; label: string }> = {};
  for (const section of ['patients', 'children'] as const) {
    if (items.some((item) => item.section === section)) {
      categories[section] = await resolveCategory(section);
      console.log(`Toifa (${section}): ${categories[section].label}`);
    }
  }
  console.log('');

  type Plan = { item: NewPost; index: number; existing: Record<string, unknown> | null };
  const plans: Plan[] = [];
  for (const [index, item] of items.entries()) {
    const post = await prisma.post.findUnique({ where: { slug: item.slug } });
    plans.push({ item, index, existing: post as Record<string, unknown> | null });
    const action = !post ? 'YARATILADI' : update ? 'YANGILANADI' : 'BOR (tegilmaydi)';
    console.log(`${item.source.padEnd(8)} ${action.padEnd(17)} ${item.slug}`);
    console.log(`         ${item.title_uz}`);
    console.log(`         boʻlim: ${item.section}, matn uz: ${item.body_uz.length}, ru: ${item.body_ru.length} belgi, muqova: ${item.cover || 'yoʻq'}`);
  }

  const toCreate = plans.filter((p) => !p.existing);
  const toUpdate = update ? plans.filter((p) => p.existing) : [];
  console.log(`\nYaratiladi: ${toCreate.length}, yangilanadi: ${toUpdate.length}, tegilmaydi: ${plans.length - toCreate.length - toUpdate.length}`);

  if (assets.length > 0) {
    console.log('\nRasm fayllari:');
    for (const asset of assets) console.log(`   ${asset.state.padEnd(11)} ${asset.name}`);
    if (!fs.existsSync(uploadsDir)) {
      throw new Error(`Uploads papkasi topilmadi: ${uploadsDir}. UPLOADS_DIR ni koʻrsating.`);
    }
  }

  if (!apply) {
    console.log('\nSinov tugadi. Qoʻllash uchun --apply bilan qayta ishga tushiring.');
    return;
  }
  if (toCreate.length === 0 && toUpdate.length === 0) {
    console.log('\nBajariladigan ish yoʻq.');
    return;
  }

  if (toUpdate.length > 0) {
    const backupDir = process.env.POSTS_BACKUP_DIR || '/var/backups/acoustic';
    fs.mkdirSync(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `posts-before-${stamp}.json`);
    fs.writeFileSync(backupFile, JSON.stringify(toUpdate.map((p) => p.existing), null, 2), { mode: 0o600 });
    console.log(`\nAvvalgi qiymatlar saqlandi: ${backupFile}`);
  }

  // Avval rasmlar koʻchiriladi: fayl yozilmasa, bazaga hech narsa yozilmaydi.
  let copied = 0;
  for (const asset of assets) {
    if (asset.state === 'bir xil') continue;
    fs.copyFileSync(asset.source, asset.target);
    fs.chmodSync(asset.target, 0o644);
    if (!sameFile(asset.source, asset.target)) throw new Error(`Rasm toʻliq koʻchirilmadi: ${asset.target}`);
    copied += 1;
  }
  if (assets.length > 0) console.log(`Rasmlar: ${copied} ta koʻchirildi, ${assets.length - copied} ta allaqachon joyida.`);

  // Roʻyxatdagi birinchi maqola eng yangi sana oladi, shunda sahifada tartib saqlanadi.
  const base = Date.now();
  for (const { item, index, existing } of plans) {
    const texts = {
      title_uz: item.title_uz,
      title_ru: item.title_ru,
      excerpt_uz: item.excerpt_uz,
      excerpt_ru: item.excerpt_ru,
      body_uz: item.body_uz,
      body_ru: item.body_ru,
    };
    if (!existing) {
      const coverId = await ensureCover(item, uploadsDir);
      await prisma.post.create({
        data: {
          ...texts,
          slug: item.slug,
          postType: 'article',
          status: draft ? 'draft' : 'published',
          categoryId: categories[item.section].id,
          publishAt: new Date(base - index * 60_000),
          tags: [],
          ...(coverId ? { coverId } : {}),
        },
      });
      console.log(`YARATILDI   ${item.slug}`);
    } else if (update) {
      const coverId = await ensureCover(item, uploadsDir);
      await prisma.post.update({
        where: { slug: item.slug },
        data: { ...texts, ...(coverId ? { coverId } : {}) },
      });
      console.log(`YANGILANDI  ${item.slug}`);
    }
  }
  console.log(`\nTayyor: ${toCreate.length} ta yaratildi, ${toUpdate.length} ta yangilandi.`);
}

main()
  .catch((error) => {
    console.error('XATO:', error.message || error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
