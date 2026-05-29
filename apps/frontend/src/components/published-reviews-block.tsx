import Link from 'next/link';
import { Star } from 'lucide-react';
import type { PublishedReviewItem } from '@/lib/api';

interface PublishedReviewsBlockProps {
  reviews: PublishedReviewItem[];
  locale: 'uz' | 'ru';
  /** Agar berilsa, shuncha ta ko‘rsatiladi */
  maxItems?: number;
  /** Bosh sahifada /feedback havolasi */
  showViewAllLink?: boolean;
  /** Sarlavha darajasi (bir sahifada bitta h1 bo‘lishi uchun) */
  headingLevel?: 'h2' | 'h3';
  /** section — to‘liq kenglik (bosh sahifa); inline — /feedback kartochkasi */
  variant?: 'section' | 'inline';
  className?: string;
}

function formatReviewDate(iso: string, locale: 'uz' | 'ru'): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function PublishedReviewsBlock({
  reviews,
  locale,
  maxItems,
  showViewAllLink,
  headingLevel = 'h2',
  variant = 'section',
  className = '',
}: PublishedReviewsBlockProps) {
  const list = maxItems ? reviews.slice(0, maxItems) : reviews;
  if (!list.length) return null;

  const title =
    locale === 'ru' ? 'Отзывы наших клиентов' : 'Mijozlarimiz sharhlari';
  const viewAll =
    locale === 'ru' ? 'Все отзывы и форма' : 'Barcha sharhlar va fikr qoldirish';
  const HeadingTag = headingLevel;

  const shellClass =
    variant === 'inline'
      ? 'rounded-xl border border-border/60 bg-white px-5 py-8 shadow-sm md:px-8'
      : 'border-t border-border/60 bg-muted/20 py-10 md:py-12';

  return (
    <section
      className={`${shellClass} ${className}`.trim()}
      aria-labelledby="published-reviews-title"
    >
      <div
        className={
          variant === 'inline'
            ? 'mx-auto max-w-full'
            : 'mx-auto max-w-5xl px-4 md:max-w-6xl md:px-6'
        }
      >
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-brand-primary">
              {locale === 'ru' ? 'Отзывы' : 'Sharhlar'}
            </p>
            <HeadingTag
              id="published-reviews-title"
              className="text-2xl font-bold text-foreground md:text-3xl"
            >
              {title}
            </HeadingTag>
          </div>
          {showViewAllLink && (
            <Link
              href="/feedback"
              className="text-sm font-semibold text-brand-primary hover:text-brand-accent hover:underline"
            >
              {viewAll} →
            </Link>
          )}
        </div>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((r) => (
            <li
              key={r.id}
              className="flex flex-col rounded-xl border border-border/80 bg-white p-5 shadow-sm"
            >
              <div className="mb-3 flex items-center gap-0.5" aria-label={`${r.rating} / 5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < r.rating
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-muted-foreground/25'
                    }`}
                    aria-hidden
                  />
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-foreground/90">
                <p className="whitespace-pre-wrap">{r.body}</p>
              </blockquote>
              <footer className="mt-4 flex flex-wrap items-baseline justify-between gap-2 border-t border-border/50 pt-3">
                <cite className="not-italic text-sm font-semibold text-foreground">— {r.name}</cite>
                <time className="text-xs text-muted-foreground" dateTime={r.createdAt}>
                  {formatReviewDate(r.createdAt, locale)}
                </time>
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
