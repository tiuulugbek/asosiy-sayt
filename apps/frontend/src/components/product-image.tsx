'use client';

import Image, { ImageProps } from 'next/image';
import { useMemo } from 'react';

const UPLOADS_ORIGIN = 'https://a.acoustic.uz';

function toUploadsUrl(src: string): string {
  if (!src || src.startsWith('data:')) return src;
  const pathMatch = src.match(/\/uploads\/[^?#]*/);
  if (pathMatch) return `${UPLOADS_ORIGIN}${pathMatch[0]}`;
  if (src.startsWith('uploads/')) return `${UPLOADS_ORIGIN}/${src}`;
  if (src.includes('acoustic.uz') && !src.includes('a.acoustic.uz')) {
    return src.replace(/https?:\/\/[^\/]*acoustic\.uz/g, UPLOADS_ORIGIN);
  }
  return src;
}

export default function ProductImage(props: ImageProps) {
  const rawSrc = props.src;
  const resolvedSrc = useMemo(() => {
    if (typeof rawSrc === 'string') return toUploadsUrl(rawSrc);
    return rawSrc;
  }, [rawSrc]);
  return <Image {...props} src={resolvedSrc} />;
}
