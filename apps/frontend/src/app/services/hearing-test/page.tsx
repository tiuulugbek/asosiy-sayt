import Link from 'next/link';
import type { Metadata } from 'next';
import { detectLocale } from '@/lib/locale-server';
import HearingTest from '@/components/hearing-test/hearing-test';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Onlayn test vaqtincha yopilgan (2026-11-17).
 * Sabab: natija foydalanuvchi javobiga bogʻliq boʻlmay qolgan — har kimga bir xil
 * natija ("chap quloqda yoʻqotilish aniqlandi") chiqayotgan edi.
 * Test tuzatilgach, bu qiymat true qilinadi.
 */
const HEARING_TEST_ENABLED = false;

const pausedText = {
  uz: {
    metaDescription:
      'Onlayn eshitish testi yangilanmoqda. Eshitishni Acoustic filiallarida tekshirtirish mumkin: 1385.',
    title: 'Onlayn eshitish testi yangilanmoqda',
    lead: 'Testni aniqroq va qulayroq qilish ustida ishlayapmiz. Tez orada u yana ishga tushadi.',
    body: 'Eshitishingizni hozir tekshirtirmoqchi boʻlsangiz, Acoustic filialiga keling. Tekshiruv ogʻriqsiz oʻtadi, natijani mutaxassis shu yerning oʻzida tushuntirib beradi.',
    call: '1385 ga qoʻngʻiroq qilish',
    or: 'yoki',
    branches: 'Filiallar manzili',
    article: 'Eshitish pasayishining birinchi belgilari haqida oʻqing',
  },
  ru: {
    metaDescription:
      'Онлайн-тест слуха обновляется. Проверить слух можно в филиалах Acoustic: 1385.',
    title: 'Онлайн-тест слуха обновляется',
    lead: 'Мы работаем над тем, чтобы тест стал точнее и удобнее. Скоро он снова заработает.',
    body: 'Если вы хотите проверить слух уже сейчас, приходите в филиал Acoustic. Проверка безболезненна, а результат специалист объяснит сразу на месте.',
    call: 'Позвонить по номеру 1385',
    or: 'или',
    branches: 'Адреса филиалов',
    article: 'Прочитайте о первых признаках снижения слуха',
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocale();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acoustic.uz';
  const testUrl = `${baseUrl}/services/hearing-test`;
  const paused = pausedText[locale === 'ru' ? 'ru' : 'uz'];

  return {
    title: locale === 'ru' ? 'Онлайн-тест слуха — Acoustic.uz' : 'Onlayn eshitish testi — Acoustic.uz',
    description: !HEARING_TEST_ENABLED
      ? paused.metaDescription
      : locale === 'ru'
        ? 'Бесплатный онлайн-тест слуха. Проверьте свой слух за 3 минуты. Результаты не являются медицинским диагнозом.'
        : 'Bepul onlayn eshitish testi. Eshitishingizni 3 daqiqada tekshiring. Natijalar tibbiy tashxis emas.',
    alternates: {
      canonical: testUrl,
      languages: {
        uz: testUrl,
        ru: testUrl,
        'x-default': testUrl,
      },
    },
  };
}

function HearingTestPaused() {
  const locale = detectLocale();
  const t = pausedText[locale === 'ru' ? 'ru' : 'uz'];

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center md:px-6 md:py-24">
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t.title}</h1>
      <p className="mt-4 text-base leading-relaxed text-foreground/90">{t.lead}</p>
      <p className="mt-3 text-base leading-relaxed text-foreground/90">{t.body}</p>

      <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <a
          href="tel:1385"
          className="inline-flex w-full items-center justify-center rounded-lg bg-brand-primary px-6 py-3 text-base font-semibold text-white transition hover:opacity-90 sm:w-auto"
        >
          {t.call}
        </a>
        <Link
          href="/branches"
          className="inline-flex w-full items-center justify-center rounded-lg border-2 border-brand-primary px-6 py-3 text-base font-semibold text-brand-primary transition hover:bg-brand-primary/5 sm:w-auto"
        >
          {t.branches}
        </Link>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {t.or}{' '}
        <a href="tel:+998712021441" className="font-semibold text-foreground hover:underline">
          71 202 14 41
        </a>
      </p>

      <p className="mt-10 text-sm">
        <Link href="/posts/eshitish-pasayishi-belgilari" className="text-brand-primary hover:underline">
          {t.article}
        </Link>
      </p>
    </section>
  );
}

export default function HearingTestPage() {
  return (
    <main className="min-h-screen bg-white">
      {HEARING_TEST_ENABLED ? <HearingTest /> : <HearingTestPaused />}
    </main>
  );
}
