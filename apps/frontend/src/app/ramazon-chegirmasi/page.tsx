import Link from 'next/link';
import Script from 'next/script';
import type { Metadata } from 'next';
import { getProducts, getSettings } from '@/lib/api-server';
import { detectLocale } from '@/lib/locale-server';
import { normalizeImageUrl } from '@/lib/image-utils';
import FadeInSection from './fade-in-section';
import RamazonProductCard from './ramazon-product-card';
import RamazonCountdown from './ramazon-countdown';

// ISR: Revalidate every 30 minutes
export const revalidate = 1800;

// Bilingual texts
const TEXTS = {
  title: { uz: 'Ramazon chegirmasi', ru: 'Рамазан скидки' },
  products: { uz: 'Mahsulotlar', ru: 'Товары' },
  detailsBtn: { uz: 'Batafsil', ru: 'Подробнее' },
  discount: { uz: 'Chegirma', ru: 'Скидка' },
  price: { uz: 'Narxi', ru: 'Цена' },
  noProducts: { uz: 'Mahsulotlar topilmadi', ru: 'Товары не найдены' },
  home: { uz: 'Bosh sahifa', ru: 'Главная' },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocale();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acoustic.uz';
  const pageUrl = `${baseUrl}/ramazon-chegirmasi`;

  const title = locale === 'ru' ? TEXTS.title.ru : TEXTS.title.uz;
  const description =
    locale === 'ru'
      ? 'Специальные скидки на слуховые аппараты в месяц Рамазан. Скидка действует 1 месяц. Acoustic.uz'
      : "Ramazon oyi munosabati bilan maxsus chegirmalar. Chegirma 1 oy davomida amal qiladi. Acoustic.uz";

  return {
    title: `${title} — Acoustic.uz`,
    description,
    alternates: {
      canonical: pageUrl,
      languages: {
        uz: pageUrl,
        ru: pageUrl,
        'x-default': pageUrl,
      },
    },
    openGraph: {
      title: `${title} — Acoustic.uz`,
      description,
      url: pageUrl,
      siteName: 'Acoustic.uz',
      images: [
        {
          url: `${baseUrl}/logo.png`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: locale === 'ru' ? 'ru_RU' : 'uz_UZ',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} — Acoustic.uz`,
      description,
      images: [`${baseUrl}/logo.png`],
    },
  };
}

export default async function RamazonChegirmasiPage() {
  const locale = detectLocale();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acoustic.uz';
  const pageUrl = `${baseUrl}/ramazon-chegirmasi`;

  // Fetch discounted products and settings (for Telegram bot link)
  const [productsResponse, settingsData] = await Promise.all([
    getProducts(
    {
      discount: true,
      status: 'published',
      limit: 50,
      offset: 0,
    },
    locale
  ),
    getSettings(locale),
  ]);

  const products = productsResponse?.items ?? [];
  const telegramBotUsername = settingsData?.telegramButtonBotUsername?.replace('@', '') || 'acousticuz_bot';
  const telegramBotUrl = `https://t.me/${telegramBotUsername}`;
  const t = (key: keyof typeof TEXTS) => (locale === 'ru' ? TEXTS[key].ru : TEXTS[key].uz);

  // BreadcrumbList Structured Data
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: t('home'), item: baseUrl },
      { '@type': 'ListItem', position: 2, name: t('title'), item: pageUrl },
    ],
  };

  const availabilityMap: Record<string, { uz: string; ru: string }> = {
    'in-stock': { uz: 'Sotuvda', ru: 'В наличии' },
    preorder: { uz: 'Buyurtmaga', ru: 'Под заказ' },
    'out-of-stock': { uz: 'Tugagan', ru: 'Нет в наличии' },
  };

  return (
    <main className="min-h-screen bg-background">
      {/* BreadcrumbList Structured Data */}
      <Script
        id="breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumbs */}
      <section className="bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground md:px-6">
          <Link href="/" className="hover:text-brand-primary" suppressHydrationWarning>
            {t('home')}
          </Link>
          <span className="mx-2">›</span>
          <span className="text-brand-primary" suppressHydrationWarning>
            {t('title')}
          </span>
        </div>
      </section>

      {/* Hero Banner - Ramazon theme: green/white gradient */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-white py-12 md:py-16">
        <div className="absolute inset-0 bg-white/10" />
        <div className="relative mx-auto max-w-6xl px-4 md:px-6">
          <h1 className="text-3xl font-bold text-white uppercase tracking-wide drop-shadow-sm md:text-4xl" suppressHydrationWarning>
            {t('title')}
          </h1>
          <RamazonCountdown locale={locale} />
        </div>
      </section>

      {/* Products Section */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <FadeInSection>
            <h2 className="mb-6 text-2xl font-bold text-foreground" suppressHydrationWarning>
              {t('products')}
            </h2>
          </FadeInSection>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => {
                let mainImage = '';
                if (product.galleryUrls?.length) {
                  mainImage = normalizeImageUrl(product.galleryUrls[0]);
                } else if (product.brand?.logo?.url) {
                  mainImage = normalizeImageUrl(product.brand.logo.url);
                }

                const hasDiscount = (product.discountPercent ?? 0) > 0;
                const currentPrice =
                  product.price != null && product.price !== ''
                    ? Number(product.price)
                    : null;
                const priceFormatted =
                  currentPrice != null
                    ? `${new Intl.NumberFormat('uz-UZ').format(currentPrice)} so'm`
                    : null;
                const originalPriceValue =
                  product.originalPrice != null && product.originalPrice !== ''
                    ? Number(product.originalPrice)
                    : hasDiscount && currentPrice != null
                      ? Math.round(currentPrice / (1 - (product.discountPercent ?? 0) / 100))
                      : null;
                const originalPriceFormatted =
                  originalPriceValue != null
                    ? `${new Intl.NumberFormat('uz-UZ').format(originalPriceValue)} so'm`
                    : null;
                const availability = product.availabilityStatus
                  ? availabilityMap[product.availabilityStatus]
                  : null;
                const availabilityLabel = availability
                  ? locale === 'ru'
                    ? availability.ru
                    : availability.uz
                  : null;

                return (
                  <FadeInSection key={product.id} delay={index * 50}>
                    <RamazonProductCard
                      product={product}
                      locale={locale}
                      mainImage={mainImage}
                      priceFormatted={priceFormatted}
                      originalPriceFormatted={originalPriceFormatted}
                      availabilityLabel={availabilityLabel}
                      detailsBtn={t('detailsBtn')}
                      telegramBotUrl={telegramBotUrl}
                    />
                  </FadeInSection>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-muted/20 p-12 text-center">
              <p className="text-lg font-semibold text-brand-accent" suppressHydrationWarning>
                {t('noProducts')}
              </p>
            </div>
          )}
        </div>
      </section>

    </main>
  );
}
