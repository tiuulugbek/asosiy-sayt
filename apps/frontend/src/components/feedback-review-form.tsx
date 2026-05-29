'use client';

import { useState } from 'react';
import { Star, Phone } from 'lucide-react';
import { createReview } from '@/lib/api';

interface FeedbackReviewFormProps {
  locale: 'uz' | 'ru';
  phoneDisplay?: string;
  phoneHref?: string;
  telegramHref?: string;
}

export default function FeedbackReviewForm({
  locale,
  phoneDisplay,
  phoneHref,
  telegramHref,
}: FeedbackReviewFormProps) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const t = {
    name: locale === 'ru' ? 'Ваше имя' : 'Ismingiz',
    rating: locale === 'ru' ? 'Оценка' : 'Baholash',
    body: locale === 'ru' ? 'Ваш отзыв' : 'Sharhingiz',
    submit: locale === 'ru' ? 'Отправить отзыв' : 'Sharh yuborish',
    submitting: locale === 'ru' ? 'Отправка…' : 'Yuborilmoqda…',
    thanks:
      locale === 'ru'
        ? 'Спасибо! Ваш отзыв принят.'
        : 'Rahmat! Sharhingiz qabul qilindi.',
    quick: locale === 'ru' ? 'Быстро связаться' : 'Tez bog‘lanish',
    fillAll:
      locale === 'ru'
        ? 'Заполните имя, оценку и текст отзыва.'
        : 'Ism, baho va sharh matnini to‘ldiring.',
    fail:
      locale === 'ru'
        ? 'Не удалось отправить. Попробуйте позже.'
        : 'Yuborib bo‘lmadi. Keyinroq urinib ko‘ring.',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || rating < 1 || body.trim().length < 3) {
      alert(t.fillAll);
      return;
    }
    setSubmitting(true);
    try {
      await createReview(
        { name: name.trim(), rating, body: body.trim() },
        locale,
      );
      setDone(true);
      setName('');
      setRating(0);
      setBody('');
      setTimeout(() => setDone(false), 8000);
    } catch {
      setError(t.fail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-8">
      {done && (
        <div
          className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
          role="status"
        >
          {t.thanks}
        </div>
      )}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="feedback-name" className="mb-1.5 block text-sm font-medium text-foreground">
            {t.name} *
          </label>
          <input
            id="feedback-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/20"
            maxLength={200}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-foreground">{t.rating} *</p>
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label={t.rating}>
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                className="rounded-md p-1 transition hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary"
                aria-pressed={rating === value}
                aria-label={`${value}`}
              >
                <Star
                  className={`h-8 w-8 sm:h-9 sm:w-9 ${
                    value <= rating
                      ? 'fill-brand-primary text-brand-primary'
                      : 'text-muted-foreground/40'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="feedback-body" className="mb-1.5 block text-sm font-medium text-foreground">
            {t.body} *
          </label>
          <textarea
            id="feedback-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={10}
            className="min-h-[200px] w-full resize-y rounded-lg border border-border px-3 py-3 text-sm leading-relaxed focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary/20"
            maxLength={8000}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-gradient-to-r from-brand-primary via-brand-primary to-brand-accent/90 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? t.submitting : t.submit}
        </button>
      </form>

      {(phoneHref || telegramHref) && (
        <div className="border-t border-border/60 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              {t.quick}
            </h3>
            <div className="flex flex-wrap items-center gap-2 sm:justify-end">
              {phoneHref && phoneDisplay && (
                <a
                  href={`tel:${phoneHref}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md bg-brand-primary px-2.5 text-xs font-medium text-white transition hover:bg-brand-accent"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
                  {phoneDisplay}
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
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
