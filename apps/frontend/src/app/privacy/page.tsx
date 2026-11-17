import type { Metadata } from 'next';
import { detectLocale } from '@/lib/locale-server';
import PageHeader from '@/components/page-header';
import {
  ShieldCheck,
  Database,
  Target,
  Users,
  Lock,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Globe,
} from 'lucide-react';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocale();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acoustic.uz';
  const privacyUrl = `${baseUrl}/privacy`;

  return {
    title:
      locale === 'ru'
        ? 'Политика конфиденциальности — Acoustic.uz'
        : 'Maxfiylik siyosati — Acoustic.uz',
    description:
      locale === 'ru'
        ? 'Как центр слуха Acoustic собирает, использует и защищает персональные данные пользователей.'
        : "Acoustic eshitish markazi foydalanuvchilarning shaxsiy ma'lumotlarini qanday yig'ishi, ulardan foydalanishi va himoya qilishi haqida.",
    alternates: {
      canonical: privacyUrl,
      languages: {
        uz: privacyUrl,
        ru: privacyUrl,
        'x-default': privacyUrl,
      },
    },
  };
}

export default async function PrivacyPage() {
  const locale = detectLocale();
  const isRu = locale === 'ru';

  const title = isRu ? 'Политика конфиденциальности' : 'Maxfiylik siyosati';
  const subtitle = isRu
    ? 'Центр слуха Acoustic'
    : 'Acoustic eshitish markazi';

  const lastUpdatedLabel = isRu ? 'Последнее обновление' : 'Oxirgi yangilanish';
  const lastUpdatedText = isRu ? '6 июня 2026 г.' : "2026-yil 6-iyun";

  const intro = isRu
    ? 'Центр слуха Acoustic («мы») уважает конфиденциальность персональных данных пользователей. Настоящая политика объясняет, какие данные мы собираем, как их используем и как защищаем.'
    : "Acoustic eshitish markazi (\u201cbiz\u201d) foydalanuvchilarning shaxsiy ma'lumotlari maxfiyligini hurmat qiladi. Ushbu siyosat biz qanday ma'lumotlarni yig'ishimiz, ulardan qanday foydalanishimiz va ularni qanday himoya qilishimizni tushuntiradi.";

  const sections = isRu
    ? [
        {
          icon: Database,
          title: '1. Какие данные мы собираем',
          intro: 'Мы можем собирать следующие данные:',
          items: [
            'Имя и фамилия',
            'Номер телефона',
            'Регион проживания (город/область)',
            'Детали вашего запроса, связанного со слухом',
          ],
          outro:
            'Эти данные собираются, когда вы заполняете рекламные формы (Lead Ads) в Facebook и Instagram или связываетесь с нами через наш сайт.',
        },
        {
          icon: Target,
          title: '2. Цели использования данных',
          intro: 'Собранные данные мы используем только для следующих целей:',
          items: [
            'Звонок и консультация по нашим услугам',
            'Помощь в записи на осмотр и визит',
            'Улучшение качества обслуживания',
          ],
        },
        {
          icon: Users,
          title: '3. Передача данных третьим лицам',
          intro:
            'Мы не продаём ваши персональные данные третьим лицам. Данные обрабатываются только сотрудниками центра Acoustic. Рекламные услуги осуществляются через Meta Platforms, Inc. (Facebook/Instagram) и подчиняются их политике конфиденциальности.',
          items: [],
        },
        {
          icon: Lock,
          title: '4. Хранение данных',
          intro:
            'Ваши данные хранятся только в течение срока, необходимого для оказания услуги, и защищены безопасным образом.',
          items: [],
        },
        {
          icon: UserCheck,
          title: '5. Ваши права',
          intro:
            'Вы в любой момент можете запросить удаление или обновление своих данных. Для этого свяжитесь с нами.',
          items: [],
        },
      ]
    : [
        {
          icon: Database,
          title: "1. Biz qanday ma'lumotlarni yig'amiz",
          intro: "Biz quyidagi ma'lumotlarni yig'ishimiz mumkin:",
          items: [
            'Ism va familiya',
            'Telefon raqami',
            'Yashash hududi (shahar/viloyat)',
            "Eshitish bilan bog'liq so'rovingiz tafsilotlari",
          ],
          outro:
            "Ushbu ma'lumotlar siz Facebook va Instagram'dagi reklama formalarini (Lead Ads) to'ldirganingizda yoki saytimiz orqali bog'langaningizda yig'iladi.",
        },
        {
          icon: Target,
          title: "2. Ma'lumotlardan foydalanish maqsadi",
          intro: "Yig'ilgan ma'lumotlardan faqat quyidagi maqsadlarda foydalanamiz:",
          items: [
            "Sizga xizmatlarimiz bo'yicha qo'ng'iroq qilish va maslahat berish",
            "Ko'rik va tashrifga yozilishingizga yordam berish",
            'Xizmat sifatini yaxshilash',
          ],
        },
        {
          icon: Users,
          title: "3. Ma'lumotlarni uchinchi shaxslarga berish",
          intro:
            "Biz shaxsiy ma'lumotlaringizni uchinchi shaxslarga sotmaymiz. Ma'lumotlar faqat Acoustic markazi xodimlari tomonidan ishlov beriladi. Reklama xizmatlari Meta Platforms, Inc. (Facebook/Instagram) orqali amalga oshiriladi va ularning maxfiylik siyosatiga bo'ysunadi.",
          items: [],
        },
        {
          icon: Lock,
          title: "4. Ma'lumotlarni saqlash",
          intro:
            "Ma'lumotlaringiz xizmat ko'rsatish uchun zarur bo'lgan muddatdagina saqlanadi va xavfsiz tarzda himoyalanadi.",
          items: [],
        },
        {
          icon: UserCheck,
          title: '5. Sizning huquqlaringiz',
          intro:
            "Siz istalgan vaqtda o'z ma'lumotlaringizni o'chirishni yoki yangilashni so'rashingiz mumkin. Buning uchun biz bilan bog'laning.",
          items: [],
        },
      ];

  const contactTitle = isRu ? '6. Свяжитесь с нами' : "6. Biz bilan bog'lanish";
  const contactItems = [
    {
      icon: Phone,
      label: isRu ? 'Телефон' : 'Telefon',
      value: '+998 71 202 14 41',
      href: 'tel:+998712021441',
    },
    {
      icon: Phone,
      label: isRu ? 'Телефон' : 'Telefon',
      value: '+998 88 855 51 11',
      href: 'tel:+998888555111',
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'acousticzakaz@gmail.com',
      href: 'mailto:acousticzakaz@gmail.com',
    },
    {
      icon: MapPin,
      label: isRu ? 'Адрес' : 'Manzil',
      value: isRu ? 'Ташкент, Узбекистан' : "Toshkent, O'zbekiston",
    },
    {
      icon: Globe,
      label: isRu ? 'Веб-сайт' : 'Veb-sayt',
      value: 'acoustic.uz',
      href: 'https://acoustic.uz',
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        locale={locale}
        breadcrumbs={[
          { label: isRu ? 'Главная' : 'Bosh sahifa', href: '/' },
          { label: title },
        ]}
        title={title}
        description={subtitle}
        icon={<ShieldCheck className="h-8 w-8 text-brand-primary" />}
      />

      <div className="mx-auto max-w-4xl px-4 py-12 md:px-6">
        {/* Last updated + intro */}
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm md:p-8">
          <span className="inline-flex items-center rounded-full bg-brand-primary/10 px-3 py-1 text-xs font-medium text-brand-primary">
            {lastUpdatedLabel}: {lastUpdatedText}
          </span>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground" suppressHydrationWarning>
            {intro}
          </p>
        </div>

        {/* Sections */}
        <div className="mt-8 space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <section
                key={index}
                className="rounded-2xl border border-border bg-white p-6 shadow-sm transition hover:shadow-md md:p-8"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10">
                    <Icon className="h-6 w-6 text-brand-primary" />
                  </div>
                  <div className="flex-1">
                    <h2
                      className="text-lg font-semibold text-foreground md:text-xl"
                      suppressHydrationWarning
                    >
                      {section.title}
                    </h2>
                    {section.intro ? (
                      <p
                        className="mt-3 text-base leading-relaxed text-muted-foreground"
                        suppressHydrationWarning
                      >
                        {section.intro}
                      </p>
                    ) : null}
                    {section.items && section.items.length > 0 ? (
                      <ul className="mt-4 space-y-2">
                        {section.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-primary" />
                            <span
                              className="text-base text-muted-foreground"
                              suppressHydrationWarning
                            >
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {'outro' in section && section.outro ? (
                      <p
                        className="mt-4 text-sm leading-relaxed text-muted-foreground"
                        suppressHydrationWarning
                      >
                        {section.outro}
                      </p>
                    ) : null}
                  </div>
                </div>
              </section>
            );
          })}

          {/* Contact section */}
          <section className="rounded-2xl border border-border bg-gradient-to-br from-brand-primary/5 to-transparent p-6 shadow-sm md:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-primary/10">
                <Phone className="h-6 w-6 text-brand-primary" />
              </div>
              <div className="flex-1">
                <h2
                  className="text-lg font-semibold text-foreground md:text-xl"
                  suppressHydrationWarning
                >
                  {contactTitle}
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {contactItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary" />
                        <div>
                          <p
                            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
                            suppressHydrationWarning
                          >
                            {item.label}
                          </p>
                          {item.href ? (
                            <a
                              href={item.href}
                              className="text-sm font-medium text-brand-primary hover:underline break-all"
                            >
                              {item.value}
                            </a>
                          ) : (
                            <p
                              className="text-sm font-medium text-foreground"
                              suppressHydrationWarning
                            >
                              {item.value}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
