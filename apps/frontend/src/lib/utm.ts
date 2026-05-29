/**
 * UTM tracking for ad campaigns (Meta/Facebook, etc.)
 * Captures utm_source, utm_medium, utm_campaign, utm_content, utm_placement, utm_platform
 */

const UTM_COOKIE_NAME = 'acoustic_utm';
const UTM_COOKIE_DAYS = 30; // Attribution window

export type UtmParams = Record<string, string>;

const UTM_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_placement',
  'utm_platform',
] as const;

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return;
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

/**
 * Extract UTM params from current URL
 */
export function getUtmFromUrl(): UtmParams | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const utm: UtmParams = {};
  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) utm[key] = value;
  }
  return Object.keys(utm).length > 0 ? utm : null;
}

/**
 * Store UTM params in cookie for later use when creating leads
 */
export function storeUtmParams(params: UtmParams): void {
  if (Object.keys(params).length === 0) return;
  setCookie(UTM_COOKIE_NAME, JSON.stringify(params), UTM_COOKIE_DAYS);
}

/**
 * Get stored UTM params from cookie (for attaching to lead)
 */
export function getStoredUtmParams(): UtmParams | null {
  const raw = getCookie(UTM_COOKIE_NAME);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (parsed && typeof parsed === 'object') {
      const result: UtmParams = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string') result[k] = v;
      }
      return Object.keys(result).length > 0 ? result : null;
    }
  } catch {
    // ignore invalid JSON
  }
  return null;
}

/**
 * Capture UTM from URL on page load and store in cookie.
 * Call this once when the app loads (client-side).
 */
export function captureUtmFromUrl(): void {
  const params = getUtmFromUrl();
  if (params) {
    storeUtmParams(params);
  }
}
