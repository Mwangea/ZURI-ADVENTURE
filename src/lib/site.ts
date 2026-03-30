import { siteConfig } from '@/config';

/**
 * Prefer explicit production URL for stable canonicals and sharing when set.
 * Falls back to the current browser origin in the client.
 */
export function getSiteOrigin(): string {
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return window.location.origin;
  }
  const fromEnv = import.meta.env.VITE_SITE_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (siteConfig.canonicalOrigin) return siteConfig.canonicalOrigin.replace(/\/$/, '');
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

export function absoluteUrl(path: string): string {
  const origin = getSiteOrigin();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return origin ? `${origin}${normalized}` : normalized;
}

export function pageTitle(segment: string): string {
  if (!segment || segment === siteConfig.siteName) return siteConfig.siteName;
  return `${segment} | ${siteConfig.siteName}`;
}
