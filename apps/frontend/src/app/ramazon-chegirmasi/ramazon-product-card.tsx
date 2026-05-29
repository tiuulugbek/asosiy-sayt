'use client';

import Link from 'next/link';
import { Send } from 'lucide-react';
import ProductImage from '@/components/product-image';

interface RamazonProductCardProps {
  product: {
    id: string;
    slug: string;
    name_uz: string;
    name_ru: string;
    galleryUrls?: string[];
    brand?: { logo?: { url?: string } } | null;
    discountPercent?: number | null;
    price?: string | null;
    originalPrice?: string | null;
    availabilityStatus?: string | null;
  };
  locale: 'uz' | 'ru';
  mainImage: string;
  priceFormatted: string | null;
  originalPriceFormatted: string | null;
  availabilityLabel: string | null;
  detailsBtn: string;
  telegramBotUrl: string;
}

export default function RamazonProductCard({
  product,
  locale,
  mainImage,
  priceFormatted,
  originalPriceFormatted,
  availabilityLabel,
  detailsBtn,
  telegramBotUrl,
}: RamazonProductCardProps) {
  const productName = locale === 'ru' ? (product.name_ru || '') : (product.name_uz || '');
  const hasDiscount = (product.discountPercent ?? 0) > 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl">
      <Link href={`/products/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square w-full overflow-hidden bg-white">
          {(product.discountPercent ?? 0) > 0 && (
            <span className="absolute left-2 top-2 z-10 rounded bg-rose-500 px-2 py-1 text-xs font-bold text-white shadow animate-pulse">
              −{product.discountPercent}%
            </span>
          )}
          {mainImage ? (
            <ProductImage
              src={mainImage}
              alt={productName}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 33vw"
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-110"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand-primary">
              <span className="text-lg font-bold text-white">Acoustic</span>
            </div>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-brand-primary md:text-base">
            {productName}
          </h3>
          {availabilityLabel && (
            <p className="text-xs font-medium text-emerald-600 md:text-sm">{availabilityLabel}</p>
          )}
          {priceFormatted && (
            <div className="mt-auto flex flex-col gap-0.5 text-sm font-medium">
              {hasDiscount && originalPriceFormatted && (
                <span className="text-muted-foreground line-through">{originalPriceFormatted}</span>
              )}
              <span className="text-brand-primary">
                <span className="font-bold">{locale === 'ru' ? 'Цена' : 'Narxi'}: </span>
                {priceFormatted}
              </span>
            </div>
          )}
        </div>
      </Link>
      <div className="border-t border-border p-3">
        <a
          href={telegramBotUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-center gap-1 rounded-lg border border-[#0088cc]/50 bg-white py-2 text-sm font-semibold text-[#0088cc] transition-all hover:bg-[#0088cc]/10"
        >
          <Send className="h-4 w-4" />
          {detailsBtn}
        </a>
      </div>
    </div>
  );
}
