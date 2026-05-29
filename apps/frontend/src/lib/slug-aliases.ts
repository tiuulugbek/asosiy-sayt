/**
 * Eski / SEO URL sluglari → bazadagi kanonik sluglar.
 * DB sluglari o'zgartirilmaydi; faqat frontend va redirectlar moslashtiriladi.
 */
export const SERVICE_SLUG_ALIASES: Record<string, string> = {
  // Admin createSlug(title) varianti; DB da category slug: kids-test
  'bolalarda-eshitishni-diagnostika-qilish': 'kids-test',
};

/** Mavjud bo'lmagan katalog sluglari → to'g'ri sahifaga yo'naltirish */
export const CATALOG_SLUG_REDIRECTS: Record<string, string> = {
  earmolds: '/catalog?productType=accessories',
  care: '/catalog?productType=accessories',
  accessories: '/catalog?productType=accessories',
  batteries: '/catalog?productType=accessories',
  batareyalar: '/catalog?productType=accessories',
};

export function resolveServiceSlug(slug: string): string {
  const normalized = slug.trim().toLowerCase();
  return SERVICE_SLUG_ALIASES[normalized] ?? normalized;
}

export function getCatalogSlugRedirect(slug: string): string | null {
  const normalized = slug.trim().toLowerCase();
  return CATALOG_SLUG_REDIRECTS[normalized] ?? null;
}
