import React from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { buildBreadcrumbJsonLd } from '@/lib/breadcrumb-schema';

interface PageHeaderProps {
  locale: 'uz' | 'ru';
  breadcrumbs: Array<{ label: string; href?: string }>;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  showHeading?: boolean;
}

export default function PageHeader({ locale, breadcrumbs, title, description, icon, showHeading = true }: PageHeaderProps) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://acoustic.uz';
  const breadcrumbItems = breadcrumbs.map((crumb) => ({
    name: crumb.label,
    item: crumb.href ? (crumb.href.startsWith('http') ? crumb.href : `${baseUrl}${crumb.href}`) : undefined,
  }));
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(breadcrumbItems);

  return (
    <>
      <Script
        id={`breadcrumb-jsonld-${title.replace(/\s+/g, '-').slice(0, 20)}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <section className="bg-[hsl(var(--secondary))]">
        <div className="mx-auto max-w-6xl px-4 py-2 sm:py-3 text-xs font-semibold uppercase tracking-wide text-white sm:px-6">
          <div className="flex flex-wrap items-center gap-x-2">
            {breadcrumbs.map((crumb, index) => (
              <span key={index} className="flex items-center">
                {index > 0 && <span className="mx-1 sm:mx-2">›</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-white/80 text-white/70 break-words" suppressHydrationWarning>
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-white break-words" suppressHydrationWarning>{crumb.label}</span>
                )}
              </span>
            ))}
          </div>
        </div>
      </section>
      {showHeading && title ? (
        <section className="bg-white py-6 md:py-8">
          <div className="mx-auto max-w-6xl px-4 md:px-6">
            <div className="flex items-start gap-3">
              {icon ? <div className="shrink-0">{icon}</div> : null}
              <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl" suppressHydrationWarning>{title}</h1>
                {description ? (
                  <p className="mt-2 text-muted-foreground" suppressHydrationWarning>{description}</p>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
