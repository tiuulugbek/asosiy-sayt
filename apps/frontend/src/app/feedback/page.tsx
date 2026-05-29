import type { Metadata } from 'next';
import { getPageBySlug, getSettings, getPublishedReviews } from '@/lib/api-server';
import { detectLocale } from '@/lib/locale-server';
import { getBilingualText } from '@/lib/locale';
import PageHeader from '@/components/page-header';
import ServiceContent from '@/components/service-content';
import FeedbackReviewForm from '@/components/feedback-review-form';
import PublishedReviewsBlock from '@/components/published-reviews-block';
import { MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocale();
  return {
    title: locale === 'ru' ? 'Обратная связь — Acoustic.uz' : 'Fikr bildirish — Acoustic.uz',
    description:
      locale === 'ru'
        ? 'Оставьте отзыв о центре Acoustic'
        : 'Acoustic markazi haqida sharh qoldiring',
  };
}

export default async function FeedbackPage() {
  const locale = detectLocale();
  const [page, settings, publishedReviewsRaw] = await Promise.all([
    getPageBySlug('feedback', locale),
    getSettings(locale),
    getPublishedReviews(locale, 50),
  ]);
  const publishedReviews = Array.isArray(publishedReviewsRaw) ? publishedReviewsRaw : [];

  const title =
    page && page.status === 'published'
      ? getBilingualText(page.title_uz, page.title_ru, locale)
      : locale === 'ru'
        ? 'Обратная связь'
        : 'Fikr bildirish';

  const body =
    page && page.status === 'published'
      ? getBilingualText(page.body_uz, page.body_ru, locale) || ''
      : '';

  const phoneRaw = settings?.phonePrimary || settings?.phoneSecondary || '';
  const phoneDisplay = phoneRaw.trim();
  const phoneHref = phoneDisplay ? phoneDisplay.replace(/\s/g, '') : '';

  const tgUser = settings?.telegramButtonBotUsername?.replace(/^@/, '') || '';
  const tgPrefill =
    locale === 'ru'
      ? 'Здравствуйте! Вопрос по отзывам / Acoustic.'
      : 'Assalomu alaykum! Acoustic bo‘yicha savol.';
  const telegramHref = tgUser
    ? `https://t.me/${encodeURIComponent(tgUser)}?text=${encodeURIComponent(tgPrefill)}`
    : '';

  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        locale={locale}
        breadcrumbs={[
          { label: locale === 'ru' ? 'Главная' : 'Bosh sahifa', href: '/' },
          { label: title },
        ]}
        title={title}
        icon={<MessageSquare className="h-8 w-8 text-white" />}
      />

      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <h1 className="mb-8 text-2xl font-bold text-foreground md:text-3xl">{title}</h1>

        {body ? (
          <section className="mb-8 rounded-lg border border-border/60 bg-white p-5 shadow-sm md:p-6">
            <ServiceContent content={body} locale={locale} />
          </section>
        ) : null}

        {/* Chop etilgan sharhlar: admin «published» qilgandan keyin shu yerda ko‘rinadi */}
        <PublishedReviewsBlock
          reviews={publishedReviews}
          locale={locale}
          headingLevel="h2"
          variant="inline"
          className="mb-8"
        />

        <section className="rounded-xl border border-border bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-6 text-xl font-bold text-foreground md:text-2xl">
            {locale === 'ru' ? 'Оставить отзыв' : 'Sharh qoldirish'}
          </h2>
          <FeedbackReviewForm
            locale={locale}
            phoneDisplay={phoneDisplay || undefined}
            phoneHref={phoneHref || undefined}
            telegramHref={telegramHref || undefined}
          />
        </section>
      </div>
    </main>
  );
}
