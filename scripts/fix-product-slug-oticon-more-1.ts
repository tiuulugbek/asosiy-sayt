/**
 * Slug tuzatish: /products/oticon-more-1-mini-rite-t da ReSound o‘rniga Oticon More 1 Mini RITE T chiqishi kerak.
 * Agar bu slug ReSound mahsulotida bo‘lsa, ReSound ga yangi slug beramiz va Oticon mahsulotiga oticon-more-1-mini-rite-t qo‘yamiz.
 *
 * Ishga tushirish: pnpm run fix:product-slug-oticon-more-1
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } },
});

const SLUG_OTICON_MORE_1 = 'oticon-more-1-mini-rite-t';
const SLUG_RESOUND_REPLACEMENT = 'resound-key-hi-ke398-dw';

function isReSoundProduct(p: { name_uz: string; name_ru: string; brand?: { name: string } | null }): boolean {
  const name = `${p.name_uz} ${p.name_ru}`.toLowerCase();
  const brand = (p.brand?.name ?? '').toLowerCase();
  return brand.includes('resound') || name.includes('resound') || name.includes('key hi') || name.includes('ke398');
}

async function ensureUniqueSlug(slug: string, excludeId?: string): Promise<string> {
  const existing = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
  if (!existing || existing.id === excludeId) return slug;
  let n = 1;
  while (true) {
    const next = `${slug}-${n}`;
    const e = await prisma.product.findUnique({ where: { slug: next }, select: { id: true } });
    if (!e) return next;
    n++;
  }
}

async function main() {
  console.log('=== Slug tuzatish: oticon-more-1-mini-rite-t (ReSound -> Oticon) ===\n');

  const current = await prisma.product.findUnique({
    where: { slug: SLUG_OTICON_MORE_1 },
    include: { brand: true },
  });

  if (!current) {
    const oticonMore1 = await prisma.product.findFirst({
      where: {
        status: 'published',
        OR: [
          { name_uz: { contains: 'More 1', mode: 'insensitive' } },
          { name_uz: { contains: 'Mini RITE', mode: 'insensitive' } },
          { name_ru: { contains: 'More 1', mode: 'insensitive' } },
        ],
        brand: { name: { contains: 'Oticon', mode: 'insensitive' } },
      },
      include: { brand: true },
    });
    if (oticonMore1 && oticonMore1.slug !== SLUG_OTICON_MORE_1) {
      const free = await ensureUniqueSlug(SLUG_OTICON_MORE_1, oticonMore1.id);
      await prisma.product.update({ where: { id: oticonMore1.id }, data: { slug: free } });
      console.log(`Oticon More 1 topildi, slug yangilandi: ${free}`);
    } else {
      console.log(`Slug "${SLUG_OTICON_MORE_1}" bo‘yicha mahsulot yo‘q. Oticon More 1 Mini RITE T qidiruvda topilmadi.`);
    }
    await prisma.$disconnect();
    return;
  }

  if (isReSoundProduct(current)) {
    const newResoundSlug = await ensureUniqueSlug(SLUG_RESOUND_REPLACEMENT, current.id);
    await prisma.product.update({ where: { id: current.id }, data: { slug: newResoundSlug } });
    console.log(`ReSound mahsulot slug o‘zgartirildi: "${current.name_uz}" -> ${newResoundSlug}`);

    const oticonMore1 = await prisma.product.findFirst({
      where: {
        status: 'published',
        id: { not: current.id },
        brand: { name: { contains: 'Oticon', mode: 'insensitive' } },
        OR: [
          { name_uz: { contains: 'More 1', mode: 'insensitive' } },
          { name_uz: { contains: 'Mini RITE', mode: 'insensitive' } },
          { name_ru: { contains: 'More 1', mode: 'insensitive' } },
        ],
      },
      include: { brand: true },
    });
    if (oticonMore1) {
      const free = await ensureUniqueSlug(SLUG_OTICON_MORE_1, oticonMore1.id);
      await prisma.product.update({ where: { id: oticonMore1.id }, data: { slug: free } });
      console.log(`Oticon More 1 slug qo‘yildi: "${oticonMore1.name_uz}" -> ${free}`);
    } else {
      console.log(`Oticon More 1 Mini RITE T bazada topilmadi. Slug ${SLUG_OTICON_MORE_1} bo‘sh qoldi (admin orqali qo‘shishingiz mumkin).`);
    }
  } else {
    console.log(`Slug "${SLUG_OTICON_MORE_1}" allaqachon Oticon/ boshqa mahsulotda: "${current.name_uz}". O‘zgartirish shart emas.`);
  }

  console.log('\nTugadi.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
