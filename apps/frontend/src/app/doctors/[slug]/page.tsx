import type { Metadata } from 'next';
import Script from 'next/script';
import { detectLocale } from '@/lib/locale-server';
import { getBilingualText } from '@/lib/locale';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone } from 'lucide-react';
import { getDoctorBySlug, getBranches, getSettings } from '@/lib/api-server';
import { normalizeImageUrl } from '@/lib/image-utils';
import {
  optimizeMetaDescription,
  optimizeTitle,
  generateSeoDescription,
} from '@/lib/seo-utils';
import PageHeader from '@/components/page-header';
import ServiceContent from '@/components/service-content';
import AppointmentForm from '@/components/appointment-form';
import type { BranchResponse } from '@/lib/api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DoctorPageProps {
  params: {
    slug: string;
  };
}

function patientTypeLabel(key: string, locale: 'uz' | 'ru'): string {
  const k = key.toLowerCase().trim();
  if (k === 'adults' || k === 'adult') return locale === 'ru' ? 'Взрослые' : 'Kattalar';
  if (k === 'children' || k === 'child') return locale === 'ru' ? 'Дети' : 'Bolalar';
  return key;
}

function branchesForDoctor(
  branchIds: string[] | undefined,
  allBranches: BranchResponse[],
): BranchResponse[] {
  const ids = branchIds ?? [];
  if (ids.length === 0) return [];
  const set = new Set(ids);
  return allBranches.filter((b) => set.has(b.id));
}

export async function generateMetadata({ params }: DoctorPageProps): Promise<Metadata> {
  const locale = detectLocale();
  const doctor = await getDoctorBySlug(params.slug, locale);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acoustic.uz';

  if (!doctor) {
    const title =
      locale === 'ru' ? 'Специалист — Acoustic.uz' : 'Mutaxassis — Acoustic.uz';
    return {
      title: optimizeTitle(title.replace(' — Acoustic.uz', '')),
      description:
        locale === 'ru'
          ? 'Специалист не найден или снят с публикации.'
          : 'Mutaxassis topilmadi yoki chop etilmagan.',
    };
  }

  const name = getBilingualText(doctor.name_uz, doctor.name_ru, locale);
  const position = getBilingualText(doctor.position_uz, doctor.position_ru, locale);
  const experience = getBilingualText(doctor.experience_uz, doctor.experience_ru, locale);
  const body = getBilingualText(doctor.description_uz, doctor.description_ru, locale);
  const optimizedTitle = optimizeTitle(name);
  const optimizedDescription =
    optimizeMetaDescription(body) ||
    optimizeMetaDescription([position, experience].filter(Boolean).join('. ')) ||
    generateSeoDescription(
      null,
      [locale === 'ru' ? 'сурдолог' : 'surdolog', locale === 'ru' ? 'аудиолог' : 'audiolog'],
      locale,
    );

  const doctorUrl = `${baseUrl}/doctors/${params.slug}`;
  let imageUrl = `${baseUrl}/logo.png`;
  if (doctor.image?.url) {
    const img = doctor.image as { url?: string; formats?: { large?: { url?: string }; medium?: { url?: string } } };
    if (img.formats?.large?.url) imageUrl = normalizeImageUrl(img.formats.large.url);
    else if (img.formats?.medium?.url) imageUrl = normalizeImageUrl(img.formats.medium.url);
    else if (img.url) imageUrl = normalizeImageUrl(img.url);
  }

  return {
    title: optimizedTitle,
    description: optimizedDescription,
    alternates: {
      canonical: doctorUrl,
      languages: {
        uz: doctorUrl,
        ru: doctorUrl,
        'x-default': doctorUrl,
      },
    },
    openGraph: {
      title: optimizedTitle,
      description: optimizedDescription,
      url: doctorUrl,
      siteName: 'Acoustic.uz',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: name }],
      locale: locale === 'ru' ? 'ru_RU' : 'uz_UZ',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: optimizedTitle,
      description: optimizedDescription,
      images: [imageUrl],
    },
  };
}

export default async function DoctorSlugPage({ params }: DoctorPageProps) {
  const locale = detectLocale();
  const [specialist, branches, settings] = await Promise.all([
    getDoctorBySlug(params.slug, locale),
    getBranches(locale),
    getSettings(locale),
  ]);

  if (!specialist) {
    return (
      <main className="min-h-screen bg-background">
      <Script
        id="physician-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(physicianJsonLd) }}
      />
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <h1 className="mb-4 text-2xl font-bold text-foreground">
              {locale === 'ru' ? 'Специалист не найден' : 'Mutaxassis topilmadi'}
            </h1>
            <Link href="/doctors" className="text-brand-primary hover:underline">
              {locale === 'ru' ? '← Вернуться к списку специалистов' : '← Mutaxassislar ro‘yxatiga qaytish'}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const name = getBilingualText(specialist.name_uz, specialist.name_ru, locale);
  const position = getBilingualText(specialist.position_uz, specialist.position_ru, locale);
  const experience = getBilingualText(specialist.experience_uz, specialist.experience_ru, locale);
  const description = getBilingualText(specialist.description_uz, specialist.description_ru, locale);

  const imageUrl = specialist.image?.url ? normalizeImageUrl(specialist.image.url) : '';
  const doctorBranches = branchesForDoctor(specialist.branchIds, branches);
  const patientTypes = specialist.patientTypes ?? [];

  const phoneRaw = settings?.phonePrimary || settings?.phoneSecondary || '';
  const phoneDisplay = phoneRaw.trim();
  const phoneHref = phoneDisplay ? phoneDisplay.replace(/\s/g, '') : '';

  const tgUser = settings?.telegramButtonBotUsername?.replace(/^@/, '') || '';
  const tgPrefill =
    locale === 'ru'
      ? `Здравствуйте! Хочу записаться на приём к ${name}.`
      : `Assalomu alaykum! ${name} qabuliga yozilmoqchiman.`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acoustic.uz';
  const physicianJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Physician',
    name,
    medicalSpecialty: 'Otolaryngology',
    worksFor: { '@type': 'MedicalOrganization', name: 'Acoustic' },
    ...(imageUrl ? { image: imageUrl } : {}),
    url: `${baseUrl}/doctors/${params.slug}`,
  };

  const telegramHref = tgUser
    ? `https://t.me/${encodeURIComponent(tgUser)}?text=${encodeURIComponent(tgPrefill)}`
    : '';

  return (
    <main className="min-h-screen bg-background">
      <Script
        id="physician-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(physicianJsonLd) }}
      />
      <PageHeader
        locale={locale}
        breadcrumbs={[
          { label: locale === 'ru' ? 'Главная' : 'Bosh sahifa', href: '/' },
          { label: locale === 'ru' ? 'Специалисты' : 'Mutaxassislar', href: '/doctors' },
          { label: name },
        ]}
        title={name}
        description={position || undefined}
      />

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
          <aside className="h-fit lg:sticky lg:top-6">
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-muted/40 shadow-lg">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={locale === 'ru' ? `Фото: ${name}` : `${name} surati`}
                  fill
                  className="object-cover"
                  sizes="300px"
                  priority
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-brand-primary">
                  <span className="text-6xl font-bold text-white">{name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
          </aside>

          <article className="min-w-0">
            <header className="mb-8 space-y-3">
              <h1 className="text-3xl font-bold text-foreground md:text-4xl lg:text-5xl" suppressHydrationWarning>
                {name}
              </h1>
              {position && (
                <p className="text-xl font-medium text-brand-primary" suppressHydrationWarning>
                  {position}
                </p>
              )}
              {experience && (
                <p className="text-lg text-muted-foreground" suppressHydrationWarning>
                  {experience}
                </p>
              )}
            </header>

            {doctorBranches.length > 0 && (
              <section className="mb-10" aria-labelledby="doctor-branches-heading">
                <h2 id="doctor-branches-heading" className="mb-3 text-xl font-bold text-foreground">
                  {locale === 'ru' ? 'Приём в филиалах' : 'Qabul filiallari'}
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {doctorBranches.map((b) => {
                    const bname = getBilingualText(b.name_uz, b.name_ru, locale);
                    const href = `/branches/${b.slug || b.id}`;
                    return (
                      <li key={b.id}>
                        <Link
                          href={href}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-brand-primary hover:text-brand-primary"
                        >
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-brand-primary" aria-hidden />
                          <span suppressHydrationWarning>{bname}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}

            {patientTypes.length > 0 && (
              <section className="mb-10" aria-labelledby="doctor-patients-heading">
                <h2 id="doctor-patients-heading" className="mb-3 text-xl font-bold text-foreground">
                  {locale === 'ru' ? 'Категории пациентов' : 'Bemor toifalari'}
                </h2>
                <ul className="flex flex-wrap gap-2">
                  {patientTypes.map((pt) => (
                    <li key={pt}>
                      <span className="inline-flex rounded-full bg-brand-primary/10 px-3 py-1 text-sm font-medium text-brand-primary">
                        {patientTypeLabel(pt, locale)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {description?.trim() && (
              <section className="mb-10" aria-labelledby="doctor-bio-heading">
                <h2 id="doctor-bio-heading" className="mb-4 text-xl font-bold text-foreground">
                  {locale === 'ru' ? 'О специалисте' : 'Mutaxassis haqida'}
                </h2>
                <div className="prose prose-lg max-w-none rounded-lg border border-border/60 bg-white/50 p-4 md:p-6">
                  <ServiceContent content={description} locale={locale} />
                </div>
              </section>
            )}

            <section
              className="rounded-xl border border-border bg-white p-5 shadow-sm md:p-6"
              aria-labelledby="doctor-cta-heading"
            >
              <h2 id="doctor-cta-heading" className="mb-5 text-xl font-bold text-foreground md:text-2xl">
                {locale === 'ru' ? 'Запись и связь' : 'Yozilish va bog‘lanish'}
              </h2>

              <div className="w-full space-y-6">
                <div className="min-w-0 w-full">
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {locale === 'ru' ? 'Онлайн-запись' : 'Onlayn yozilish'}
                  </h3>
                  <AppointmentForm
                    locale={locale}
                    doctorId={specialist.id}
                    source={`doctor-${specialist.slug}`}
                    variant="plain"
                    branchLabelMode="simple"
                    fieldsLayout="wide"
                  />
                </div>

                <div className="border-t border-border/60 pt-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      {locale === 'ru' ? 'Быстро связаться' : 'Tez bog‘lanish'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      {phoneHref && (
                        <a
                          href={`tel:${phoneHref}`}
                          className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand-primary px-2.5 text-xs font-medium text-white transition hover:bg-brand-accent"
                        >
                          <Phone className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                          <span suppressHydrationWarning>{phoneDisplay}</span>
                          <span className="sr-only">
                            {locale === 'ru' ? 'Позвонить' : 'Qo‘ng‘iroq qilish'}
                          </span>
                        </a>
                      )}
                      {telegramHref && (
                        <a
                          href={telegramHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/90 bg-background px-2.5 text-xs font-medium text-foreground/90 transition hover:border-[#229ED9]/40 hover:text-[#229ED9]"
                        >
                          <svg
                            className="h-3.5 w-3.5 shrink-0 text-[#229ED9]"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden
                          >
                            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                          </svg>
                          Telegram
                          <span className="sr-only">
                            {locale === 'ru' ? 'Открывается в новой вкладке' : 'Yangi tabda ochiladi'}
                          </span>
                        </a>
                      )}
                    </div>
                  </div>
                  {!phoneHref && !telegramHref && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {locale === 'ru'
                        ? 'Контакты — в разделе «Контакты».'
                        : 'Kontaktlar «Bog‘lanish» bo‘limida.'}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <p className="mt-8">
              <Link
                href="/doctors"
                className="text-sm font-medium text-brand-primary hover:underline"
              >
                {locale === 'ru' ? '← Все специалисты' : '← Barcha mutaxassislar'}
              </Link>
            </p>
          </article>
        </div>
      </div>
    </main>
  );
}
