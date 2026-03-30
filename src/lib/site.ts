import { siteConfig } from '@/config';

/**
 * Vite `base` (e.g. `/` or `/repo/`). Empty when app is served from domain root.
 */
export function sitePath(path: string): string {
  let base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
  if (base === '.' || base === './' || base === '/' || base === '') {
    base = '';
  } else if (!base.startsWith('/')) {
    base = `/${base}`;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

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
  const pathWithBase = sitePath(path);
  return origin ? `${origin}${pathWithBase}` : pathWithBase;
}

export function pageTitle(segment: string): string {
  if (!segment || segment === siteConfig.siteName) return siteConfig.siteName;
  return `${segment} | ${siteConfig.siteName}`;
}

/** Matches Vite `base` for React Router when the app is not at the domain root. */
export function routerBasename(): string | undefined {
  let base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
  if (base === '.' || base === './' || base === '' || base === '/') return undefined;
  if (!base.startsWith('/')) base = `/${base}`;
  return base;
}
