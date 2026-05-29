'use client';

import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import CatalogFilters from '@/components/catalog-filters';

type CatalogFiltersProps = React.ComponentProps<typeof CatalogFilters>;

interface CatalogMobileFilterDrawerProps extends CatalogFiltersProps {
  locale: 'uz' | 'ru';
}

export default function CatalogMobileFilterDrawer({
  locale,
  ...filterProps
}: CatalogMobileFilterDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="md:hidden mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border/60 bg-white px-4 py-3 text-base font-medium text-foreground shadow-sm hover:border-brand-primary/50 min-h-[48px]"
      >
        <Filter className="h-5 w-5 text-brand-primary" aria-hidden />
        {locale === 'ru' ? 'Фильтры' : 'Filtrlar'}
      </button>

      {isOpen ? (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/50 md:hidden"
            onClick={() => setIsOpen(false)}
            aria-hidden
          />
          <div
            className="fixed inset-x-0 bottom-0 z-[70] flex max-h-[85vh] flex-col rounded-t-2xl bg-white shadow-2xl md:hidden pb-[env(safe-area-inset-bottom)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="catalog-filter-title"
          >
                        <div className="flex items-center justify-between border-b border-border/60 px-4 py-4">
              <h2 id="catalog-filter-title" className="text-lg font-semibold text-brand-accent">
                {locale === 'ru' ? 'Фильтры' : 'Filtrlar'}
              </h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:bg-muted/50"
                aria-label={locale === 'ru' ? 'Закрыть' : 'Yopish'}
              >
                <X className="h-6 w-6 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <CatalogFilters {...filterProps} />
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
