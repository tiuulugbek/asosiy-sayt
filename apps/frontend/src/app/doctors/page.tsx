import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { detectLocale } from '@/lib/locale-server';
import { getBilingualText } from '@/lib/locale';
import { getDoctors, getBranches } from '@/lib/api-server';
import type { DoctorResponse } from '@/lib/api';
import { normalizeImageUrl } from '@/lib/image-utils';
import BranchesSidebar from '@/components/branches-sidebar';
import PageHeader from '@/components/page-header';
import { filterAndSortDoctors } from '@/lib/doctors-filters';
import { MapPin, Search } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const locale = detectLocale();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acoustic.uz';
  const pageUrl = `${baseUrl}/doctors`;
  const title = locale === 'ru' ? 'Специалисты — Acoustic.uz' : 'Mutaxassislar — Acoustic.uz';
  const description =
    locale === 'ru'
      ? 'Сурдологи и аудиологи центра Acoustic — опыт, филиалы и запись на приём.'
      : 'Acoustic markazi surdolog va audiologlari — tajriba, filiallar va qabulga yozilish.';
  const imageUrl = `${baseUrl}/logo.png`;

  return {
    title,
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
      title,
      description,
      url: pageUrl,
      siteName: 'Acoustic.uz',
      images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
      locale: locale === 'ru' ? 'ru_RU' : 'uz_UZ',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const locale = detectLocale();
  const branchRaw = searchParams.branch;
  const branchId = typeof branchRaw === 'string' ? branchRaw : undefined;
  const qRaw = searchParams.q;
  const q = typeof qRaw === 'string' ? qRaw : undefined;

  const [allSpecialists, branches] = await Promise.all([getDoctors(locale), getBranches(locale)]);

  const specialists = filterAndSortDoctors(allSpecialists, locale, {
    branchId,
    query: q,
  });

  const branchLabel = (id: string) => {
    const b = branches.find((x) => x.id === id);
    return b ? getBilingualText(b.name_uz, b.name_ru, locale) : id;
  };

  const showReset = Boolean(branchId || (q && q.trim()));

  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        locale={locale}
        breadcrumbs={[
          { label: locale === 'ru' ? 'Главная' : 'Bosh sahifa', href: '/' },
          { label: locale === 'ru' ? 'Специалисты' : 'Mutaxassislar' },
        ]}
        title={locale === 'ru' ? 'Наши специалисты' : 'Bizning mutaxassislarimiz'}
        description={
          locale === 'ru'
            ? 'Профессиональные сурдологи и аудиологи с многолетним опытом работы'
            : "Ko'p yillik tajribaga ega professional surdologlar va audiologlar"
        }
      />

      <section className="bg-white py-10 md:py-12">
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-foreground md:text-3xl" suppressHydrationWarning>
              {locale === 'ru' ? 'Наши специалисты' : 'Bizning mutaxassislarimiz'}
            </h1>
          </header>

          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div>
              <form
                method="get"
                className="mb-8 flex flex-col gap-4 rounded-lg border border-border bg-muted/20 p-4 sm:flex-row sm:flex-wrap sm:items-end"
                role="search"
                aria-label={locale === 'ru' ? 'Фильтр специалистов' : 'Mutaxassis filtri'}
              >
                <div className="min-w-[200px] flex-1">
                  <label htmlFor="doctors-branch" className="mb-1.5 block text-xs font-medium text-foreground">
                    {locale === 'ru' ? 'Филиал' : 'Filial'}
                  </label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <select
                      id="doctors-branch"
                      name="branch"
                      defaultValue={branchId ?? ''}
                      className="w-full appearance-none rounded-md border border-border bg-white py-2.5 pl-10 pr-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/20"
                    >
                      <option value="">
                        {locale === 'ru' ? 'Все филиалы' : 'Barcha filiallar'}
                      </option>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {getBilingualText(b.name_uz, b.name_ru, locale)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="min-w-[200px] flex-1">
                  <label htmlFor="doctors-q" className="mb-1.5 block text-xs font-medium text-foreground">
                    {locale === 'ru' ? 'Поиск' : 'Qidiruv'}
                  </label>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="doctors-q"
                      type="search"
                      name="q"
                      defaultValue={q ?? ''}
                      placeholder={
                        locale === 'ru' ? 'Имя, должность…' : 'Ism, lavozim…'
                      }
                      className="w-full rounded-md border border-border bg-white py-2.5 pl-10 pr-3 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/20"
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:pb-0.5">
                  <button
                    type="submit"
                    className="rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-accent"
                  >
                    {locale === 'ru' ? 'Применить' : 'Qo‘llash'}
                  </button>
                  {showReset && (
                    <Link
                      href="/doctors"
                      className="inline-flex items-center rounded-lg border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground transition hover:bg-muted/40"
                    >
                      {locale === 'ru' ? 'Сбросить' : 'Tozalash'}
                    </Link>
                  )}
                </div>
              </form>

              <p className="mb-4 text-sm text-muted-foreground" suppressHydrationWarning>
                {locale === 'ru'
                  ? `Найдено: ${specialists.length}`
                  : `Topildi: ${specialists.length}`}
                {branchId && (
                  <span suppressHydrationWarning>
                    {' '}
                    · {locale === 'ru' ? 'филиал' : 'filial'}: {branchLabel(branchId)}
                  </span>
                )}
              </p>

              <h2 className="sr-only">
                {locale === 'ru' ? 'Список специалистов' : 'Mutaxassislar ro‘yxati'}
              </h2>

              {specialists.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {specialists.map((specialist) => (
                    <DoctorCard key={specialist.id} specialist={specialist} locale={locale} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border py-12 text-center">
                  <p className="text-muted-foreground" suppressHydrationWarning>
                    {locale === 'ru'
                      ? 'По заданным условиям никого не найдено. Измените фильтр или поиск.'
                      : 'Shartlarga mos mutaxassis topilmadi. Filtr yoki qidiruvni o‘zgartiring.'}
                  </p>
                  {showReset && (
                    <Link href="/doctors" className="mt-4 inline-block text-sm font-medium text-brand-primary hover:underline">
                      {locale === 'ru' ? 'Показать всех' : 'Barchasini ko‘rsatish'}
                    </Link>
                  )}
                </div>
              )}
            </div>

            <aside className="space-y-6">
              <BranchesSidebar locale={locale} branches={branches || []} />

              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground" suppressHydrationWarning>
                  {locale === 'ru' ? 'Ваши отзывы' : 'Sizning fikrlaringiz'}
                </h3>
                <p className="mb-4 text-sm text-muted-foreground" suppressHydrationWarning>
                  {locale === 'ru'
                    ? 'Реальные отзывы о работе Центров, врачах и слуховых аппаратах'
                    : 'Markazlar, shifokorlar va eshitish apparatlari haqida haqiqiy fikrlar'}
                </p>
                <Link
                  href="/feedback"
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand-accent hover:gap-3"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  {locale === 'ru' ? 'Оставить отзыв' : 'Fikr bildirish'}
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function DoctorCard({ specialist, locale }: { specialist: DoctorResponse; locale: 'uz' | 'ru' }) {
  const name = getBilingualText(specialist.name_uz, specialist.name_ru, locale);
  const position = getBilingualText(specialist.position_uz, specialist.position_ru, locale);
  const experience = getBilingualText(specialist.experience_uz, specialist.experience_ru, locale);
  const imageUrl = specialist.image?.url ? normalizeImageUrl(specialist.image.url) : '';

  return (
    <Link
      href={`/doctors/${specialist.slug}`}
      className="group flex gap-4 overflow-hidden rounded-lg border border-border bg-white p-4 transition hover:border-brand-primary hover:shadow-md"
    >
      <div className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-muted/20">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="96px"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-brand-primary">
            <span className="text-2xl font-bold text-white">{name.charAt(0).toUpperCase()}</span>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <h3
          className="mb-1 line-clamp-1 text-base font-semibold text-foreground transition-colors group-hover:text-brand-primary"
          suppressHydrationWarning
        >
          {name}
        </h3>
        {position && (
          <p className="mb-1 line-clamp-1 text-xs font-medium text-brand-primary" suppressHydrationWarning>
            {position}
          </p>
        )}
        {experience && (
          <p className="mb-2 text-xs text-muted-foreground" suppressHydrationWarning>
            {experience}
          </p>
        )}
        <span
          className="mt-auto inline-flex min-h-[44px] items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-brand-primary transition-all group-hover:gap-2"
          suppressHydrationWarning
        >
          {locale === 'ru' ? 'Подробнее' : 'Batafsil'}
          <svg className="h-3 w-3 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
