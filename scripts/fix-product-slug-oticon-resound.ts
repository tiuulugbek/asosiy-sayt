/**
 * Slug aralashuvini tuzatish: /products/oticon-jet-2-bte-pp da ReSound chiqmasin,
 * Oticon JET 2 BTE PP o‘z slug’ida qolsun, ReSound mahsuloti o‘chmasin.
 *
 * Ish:
 * 1) Slug oticon-jet-2-bte-pp dagi mahsulotni tekshiramiz.
 * 2) Agar u ReSound bo‘lsa: uning slug’ini resound-key-hi-ke398-dw qilamiz.
 * 3) Oticon JET 2 BTE PP uchun slug oticon-jet-2-bte-pp bo‘lgan mahsulot yo‘q bo‘lsa, qo‘shamiz.
 *
 * Hech qanday mahsulot o‘chirilmaydi.
 *
 * Ishga tushirish: pnpm run fix:product-slug-oticon-resound
 * yoki: pnpm --filter @acoustic/backend exec ts-node --transpile-only ../../scripts/fix-product-slug-oticon-resound.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DATABASE_URL },
  },
});

const OTICON_SLUG = 'oticon-jet-2-bte-pp';
const RESOUND_NEW_SLUG = 'resound-key-hi-ke398-dw';

const OTICON_JET_2_BTE_PP_DESCRIPTION_UZ =
  "<p>OTICON JET 2 BTE PP — bu JET 2 seriyasining oshirilgan quvvatga ega quloq orqali eshitish apparati bo'lib, o'rtacha va og'ir eshitish qobiliyatini yo'qotgan foydalanuvchilar (105 dB gacha) uchun mo'ljallangan. Model Velox platformasida 48 ta tovushni qayta ishlash kanallari bilan jihozlangan bo'lib, buzilishlarsiz kuchli va toza tovush kuchaytirishni ta'minlayadi. 8000 Hz gacha bo'lgan chastota diapazoni nutq tushunarliligida muhim bo'lgan yuqori chastotali tovushlarni farqlash imkonini beradi. Apparat avtomatik shovqinni susaytirish tizimi, yo'naltirilgan mikrofonlar va fikr-mulohazalarni susaytirish funktsiyasi bilan jihozlangan. Speech Guard texnologiyasi shovqinli muhtida ham nutqni optimal qayta ishlashni ta'minlayadi. Boshqaruv mexanik balandlik regulyatori va dasturlarni almashtirish tugmasi orqali amalga oshiriladi. Korpus mustahkam, namlikdan himoyalangan materialdan yasalgan bo'lib, ter va namlikdan himoya beradi.</p>";

const OTICON_JET_2_BTE_PP_DESCRIPTION_RU =
  "<p>OTICON JET 2 BTE PP — заушный слуховой аппарат серии JET 2 с повышенной мощностью, предназначенный для пользователей с умеренной и тяжёлой потерей слуха (до 105 дБ). Модель оснащена 48 каналами обработки звука на платформе Velox, обеспечивающими мощное и чистое усиление без искажений. Частотный диапазон до 8000 Гц позволяет различать высокочастотные звуки, важные для разборчивости речи. Аппарат оснащён системой автоматического шумоподавления, направленными микрофонами и функцией подавления обратной связи. Технология Speech Guard обеспечивает оптимальную обработку речи в шумной среде. Управление осуществляется механическим регулятором громкости и кнопкой переключения программ. Корпус выполнен из прочного, влагозащищённого материала.</p>";

function isReSoundProduct(product: { name_uz: string; name_ru: string; brand?: { name: string } | null }): boolean {
  const name = `${product.name_uz} ${product.name_ru}`.toLowerCase();
  const brandName = (product.brand?.name ?? '').toLowerCase();
  return (
    brandName.includes('resound') ||
    name.includes('resound') ||
    name.includes('ke398') ||
    name.includes('key hi')
  );
}

async function ensureUniqueSlug(slug: string, excludeProductId?: string): Promise<string> {
  const existing = await prisma.product.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!existing || existing.id === excludeProductId) return slug;
  let counter = 1;
  while (true) {
    const next = `${slug}-${counter}`;
    const nextExisting = await prisma.product.findUnique({
      where: { slug: next },
      select: { id: true },
    });
    if (!nextExisting) return next;
    counter++;
  }
}

function dbHostHint(): string {
  const u = process.env.DATABASE_URL;
  if (!u) return '(DATABASE_URL o\'rnatilmagan)';
  try {
    const url = new URL(u.replace(/^postgresql:/, 'http:'));
    return `${url.hostname}${url.pathname ? url.pathname.replace(/^\//, '') : ''}`;
  } catch {
    return '(URL parse qilinmadi)';
  }
}

async function main() {
  console.log('=== Slug tuzatish: oticon-jet-2-bte-pp / ReSound Key HI ===\n');
  console.log('Baza (host):', dbHostHint());
  console.log('');

  const productWithSlug = await prisma.product.findUnique({
    where: { slug: OTICON_SLUG },
    include: { brand: true },
  });

  if (!productWithSlug) {
    console.log(`Slug "${OTICON_SLUG}" bo'lgan mahsulot topilmadi. Oticon JET 2 BTE PP ni qo'shamiz (agar boshqa joyda yo'q bo'lsa).`);
    const existingOticon = await prisma.product.findFirst({
      where: {
        name_uz: { contains: 'OTICON JET 2 BTE PP', mode: 'insensitive' },
        status: 'published',
      },
      include: { brand: true },
    });
    if (existingOticon) {
      console.log(`Topildi: "${existingOticon.name_uz}" (slug: ${existingOticon.slug}). Slug ni ${OTICON_SLUG} qilamiz.`);
      if (existingOticon.slug !== OTICON_SLUG) {
        const freeSlug = await ensureUniqueSlug(OTICON_SLUG);
        await prisma.product.update({
          where: { id: existingOticon.id },
          data: { slug: freeSlug },
        });
        console.log(`  Yangi slug: ${freeSlug}`);
      }
    } else {
      const oticonBrand = await prisma.brand.findFirst({
        where: { name: { contains: 'Oticon', mode: 'insensitive' } },
      });
      if (!oticonBrand) {
        console.log('Oticon brendi topilmadi. Faqat slug bo\'sh qolganini tekshirish mumkin.');
        await prisma.$disconnect();
        return;
      }
      await prisma.product.create({
        data: {
          name_uz: 'OTICON JET 2 BTE PP',
          name_ru: 'OTICON JET 2 BTE PP',
          slug: OTICON_SLUG,
          productType: 'hearing-aids',
          description_uz: OTICON_JET_2_BTE_PP_DESCRIPTION_UZ,
          description_ru: OTICON_JET_2_BTE_PP_DESCRIPTION_RU,
          formFactors: ['BTE'],
          audience: ['adults'],
          paymentOptions: ['cash', 'installment'],
          availabilityStatus: 'in-stock',
          status: 'published',
          brandId: oticonBrand.id,
        },
      });
      console.log(`Oticon JET 2 BTE PP qo'shildi (slug: ${OTICON_SLUG}).`);
    }
    await prisma.$disconnect();
    return;
  }

  if (isReSoundProduct(productWithSlug)) {
    console.log(`Slug "${OTICON_SLUG}" dagi mahsulot ReSound: "${productWithSlug.name_uz}".`);
    const newSlug = await ensureUniqueSlug(RESOUND_NEW_SLUG, productWithSlug.id);
    await prisma.product.update({
      where: { id: productWithSlug.id },
      data: { slug: newSlug },
    });
    console.log(`  ReSound mahsulotining slug'i o'zgartirildi: ${newSlug} (o'chirilmadi).`);

    const oticonExists = await prisma.product.findUnique({
      where: { slug: OTICON_SLUG },
    });
    if (oticonExists) {
      console.log(`  Slug "${OTICON_SLUG}" endi boshqa mahsulotda (id: ${oticonExists.id}).`);
    } else {
      const oticonBrand = await prisma.brand.findFirst({
        where: { name: { contains: 'Oticon', mode: 'insensitive' } },
      });
      if (!oticonBrand) {
        console.log('  Oticon brendi topilmadi — Oticon JET 2 BTE PP qo\'shilmadi. ReSound tuzatildi.');
      } else {
        await prisma.product.create({
          data: {
            name_uz: 'OTICON JET 2 BTE PP',
            name_ru: 'OTICON JET 2 BTE PP',
            slug: OTICON_SLUG,
            productType: 'hearing-aids',
            description_uz: OTICON_JET_2_BTE_PP_DESCRIPTION_UZ,
            description_ru: OTICON_JET_2_BTE_PP_DESCRIPTION_RU,
            formFactors: ['BTE'],
            audience: ['adults'],
            paymentOptions: ['cash', 'installment'],
            availabilityStatus: 'in-stock',
            status: 'published',
            brandId: oticonBrand.id,
          },
        });
        console.log(`  Oticon JET 2 BTE PP qo'shildi (slug: ${OTICON_SLUG}).`);
      }
    }
  } else {
    console.log(`Slug "${OTICON_SLUG}" dagi mahsulot allaqachon Oticon: "${productWithSlug.name_uz}". O'zgartirish shart emas.`);
  }

  console.log('\nTugadi. Hech qanday mahsulot o\'chirilmadi.');
  console.log('\nAgar saytda (acoustic.uz) hali ReSound chiqsa:');
  console.log('  1) Production backend ishlatadigan DATABASE_URL shu hostga ishorani tekshiring.');
  console.log('  2) Frontend keshnı yangilash: POST https://acoustic.uz/api/revalidate?path=/products/oticon-jet-2-bte-pp');
  console.log('     (Agar REVALIDATE_SECRET o\'rnatilgan bo\'lsa, Authorization: Bearer <secret> yuboring.)');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
