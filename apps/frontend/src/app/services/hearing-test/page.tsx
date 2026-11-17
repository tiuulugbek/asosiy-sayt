import Link from 'next/link';
import type { Metadata } from 'next';
import { detectLocale } from '@/lib/locale-server';
import ToneTest from '@/components/hearing-test/tone-test';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Onlayn test yoqilgan (2026-11-17, yangi variant: components/hearing-test/tone-test.tsx).
 * Testni vaqtincha yopish kerak boʻlsa, bu qiymat false qilinadi: sahifada "yangilanmoqda" xabari chiqadi,
 * test esa faqat /services/hearing-test?preview=1 manzilida ochiladi.
 */
const HEARING_TEST_ENABLED = true;

const texts = {
  uz: {
    metaTitle: 'Onlayn eshitish testi — Acoustic.uz',
    metaDescription:
      'Bepul onlayn eshitish testi: naushnik taqib, 3–5 daqiqada har bir quloqni alohida tekshiring. Natija tibbiy tashxis emas.',
    pausedDescription: 'Onlayn eshitish testi yangilanmoqda. Eshitishni Acoustic filiallarida tekshirtirish mumkin: 1385.',
    pausedTitle: 'Onlayn eshitish testi yangilanmoqda',
    pausedLead: 'Testni aniqroq va qulayroq qilish ustida ishlayapmiz. Tez orada u yana ishga tushadi.',
    pausedBody:
      'Eshitishingizni hozir tekshirtirmoqchi boʻlsangiz, Acoustic filialiga keling. Tekshiruv ogʻriqsiz oʻtadi, natijani mutaxassis shu yerning oʻzida tushuntirib beradi.',
    call: '1385 ga qoʻngʻiroq qilish',
    or: 'yoki',
    branches: 'Filiallar manzili',
    article: 'Eshitish pasayishining birinchi belgilari haqida oʻqing',
    aboutTitle: 'Test haqida',
    about: [
      {
        title: 'Qanday ishlaydi',
        text: 'Test har bir quloqqa toʻrt xil balandlikdagi tovushni beradi. Siz har bir tovushni zoʻrgʻa eshitadigan darajaga keltirasiz. Bu taxminan 3–5 daqiqa oladi.',
      },
      {
        title: 'Nima kerak',
        text: 'Ikki quloqli naushnik va tinch joy. Karnay orqali test oʻtkazib boʻlmaydi, chunki har bir quloq alohida tekshiriladi.',
      },
      {
        title: 'Natija nimani bildiradi',
        text: 'Test tashxis qoʻymaydi. U eshitishni filialda tekshirtirish kerak yoki kerak emasligi haqida yoʻnalish beradi. Natijaga naushnik va atrofdagi shovqin ham taʼsir qiladi.',
      },
    ],
    faqTitle: 'Savol-javob',
    faq: [
      {
        q: 'Onlayn test filialdagi tekshiruv oʻrnini bosadimi?',
        a: 'Yoʻq. Filialda eshitish maxsus uskunada tekshiriladi va natijani mutaxassis tushuntiradi. Onlayn test faqat birinchi tasavvurni beradi.',
      },
      {
        q: 'Natijam yaxshi chiqdi, lekin gaplarni tushunishim qiyin. Nima qilay?',
        a: 'Test yengil pasayishni yoki shovqinli joyda nutqni tushunishdagi qiyinchilikni koʻrsatmasligi mumkin. Qiyinchilik sezayotgan boʻlsangiz, eshitishni filialda tekshirtiring.',
      },
      {
        q: 'Test bolalar uchun ham toʻgʻri keladimi?',
        a: 'Test kattalar uchun moʻljallangan. Bolaning eshitishi boshqa usullar bilan, mutaxassis huzurida tekshiriladi.',
      },
      {
        q: 'Natijam saqlanadimi?',
        a: 'Yoʻq. Natija faqat shu sahifada koʻrsatiladi va hech qayerga yuborilmaydi.',
      },
    ],
    kidsLink: 'Bolalar eshitishini tekshirish usullari',
  },
  ru: {
    metaTitle: 'Онлайн-тест слуха — Acoustic.uz',
    metaDescription:
      'Бесплатный онлайн-тест слуха: наденьте наушники и за 3–5 минут проверьте каждое ухо отдельно. Результат не является медицинским диагнозом.',
    pausedDescription: 'Онлайн-тест слуха обновляется. Проверить слух можно в филиалах Acoustic: 1385.',
    pausedTitle: 'Онлайн-тест слуха обновляется',
    pausedLead: 'Мы работаем над тем, чтобы тест стал точнее и удобнее. Скоро он снова заработает.',
    pausedBody:
      'Если вы хотите проверить слух уже сейчас, приходите в филиал Acoustic. Проверка безболезненна, а результат специалист объяснит сразу на месте.',
    call: 'Позвонить по номеру 1385',
    or: 'или',
    branches: 'Адреса филиалов',
    article: 'Прочитайте о первых признаках снижения слуха',
    aboutTitle: 'О тесте',
    about: [
      {
        title: 'Как это работает',
        text: 'Тест подаёт в каждое ухо звуки четырёх разных высот. Для каждого звука вы устанавливаете уровень, на котором он едва слышен. Это занимает около 3–5 минут.',
      },
      {
        title: 'Что понадобится',
        text: 'Наушники на оба уха и тихое место. Через динамик тест провести нельзя, потому что каждое ухо проверяется отдельно.',
      },
      {
        title: 'Что означает результат',
        text: 'Тест не ставит диагноз. Он подсказывает, стоит ли проверить слух в филиале. На результат влияют также наушники и шум вокруг.',
      },
    ],
    faqTitle: 'Вопросы и ответы',
    faq: [
      {
        q: 'Заменяет ли онлайн-тест проверку в филиале?',
        a: 'Нет. В филиале слух проверяют на специальном оборудовании, а результат объясняет специалист. Онлайн-тест даёт только первое представление.',
      },
      {
        q: 'Результат хороший, но мне трудно разбирать речь. Что делать?',
        a: 'Тест может не показать лёгкое снижение слуха или трудности с пониманием речи в шуме. Если вы замечаете трудности, проверьте слух в филиале.',
      },
      {
        q: 'Подходит ли тест для детей?',
        a: 'Тест рассчитан на взрослых. Слух ребёнка проверяют другими методами, на приёме у специалиста.',
      },
      {
        q: 'Сохраняется ли мой результат?',
        a: 'Нет. Результат показывается только на этой странице и никуда не отправляется.',
      },
    ],
    kidsLink: 'Методы проверки слуха у детей',
  },
} as const;

type PageLocale = keyof typeof texts;
const pageLocale = (): PageLocale => (detectLocale() === 'ru' ? 'ru' : 'uz');

export async function generateMetadata({ searchParams }: { searchParams?: { preview?: string } }): Promise<Metadata> {
  const t = texts[pageLocale()];
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acoustic.uz';
  const testUrl = `${baseUrl}/services/hearing-test`;
  const showTest = HEARING_TEST_ENABLED || searchParams?.preview === '1';

  return {
    title: t.metaTitle,
    description: showTest ? t.metaDescription : t.pausedDescription,
    alternates: {
      canonical: testUrl,
      languages: {
        uz: testUrl,
        ru: testUrl,
        'x-default': testUrl,
      },
    },
    openGraph: {
      title: t.metaTitle,
      description: showTest ? t.metaDescription : t.pausedDescription,
      url: testUrl,
      images: [{ url: `${baseUrl}/og-image.jpg`, width: 1200, height: 630 }],
    },
  };
}

function HearingTestPaused() {
  const t = texts[pageLocale()];

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center md:px-6 md:py-24">
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t.pausedTitle}</h1>
      <p className="mt-4 text-base leading-relaxed text-foreground/90">{t.pausedLead}</p>
      <p className="mt-3 text-base leading-relaxed text-foreground/90">{t.pausedBody}</p>

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

/** Test ostidagi tushuntirish: test nima, nima kerak, natija nimani bildiradi, savol-javob. */
function HearingTestInfo() {
  const t = texts[pageLocale()];
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: t.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };

  return (
    <section className="mx-auto max-w-5xl px-5 pb-16 pt-6 md:px-12">
      <h2 className="text-2xl font-bold text-foreground">{t.aboutTitle}</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {t.about.map((item) => (
          <div key={item.title} className="rounded-2xl border border-border p-5">
            <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/80">{item.text}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-12 text-2xl font-bold text-foreground">{t.faqTitle}</h2>
      <dl className="mt-6 space-y-5">
        {t.faq.map((item, index) => (
          <div key={item.q}>
            <dt className="text-base font-semibold text-foreground">{item.q}</dt>
            <dd className="mt-1 text-base leading-relaxed text-foreground/80">
              {item.a}
              {index === 2 && (
                <>
                  {' '}
                  <Link href="/services/kids-test" className="text-brand-primary hover:underline">
                    {t.kidsLink}
                  </Link>
                </>
              )}
            </dd>
          </div>
        ))}
      </dl>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
    </section>
  );
}

export default function HearingTestPage({ searchParams }: { searchParams?: { preview?: string } }) {
  const showTest = HEARING_TEST_ENABLED || searchParams?.preview === '1';
  return (
    <main className="min-h-screen bg-white">
      {showTest ? (
        <>
          <ToneTest />
          <HearingTestInfo />
        </>
      ) : (
        <HearingTestPaused />
      )}
    </main>
  );
}
