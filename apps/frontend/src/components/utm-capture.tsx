'use client';

import { useEffect } from 'react';
import { captureUtmFromUrl } from '@/lib/utm';

/**
 * Captures UTM params from URL on first load and stores in cookie.
 * Used to attribute leads to ad campaigns (Meta, etc.).
 */
export default function UtmCapture() {
  useEffect(() => {
    captureUtmFromUrl();
  }, []);
  return null;
}
