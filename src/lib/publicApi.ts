import { API_BASE, apiRequest } from '@/lib/api';

const PUBLIC_CACHE_PREFIX = 'zuri.public.cache:';
const PUBLIC_CACHE_TTL_MS = 10 * 60 * 1000;
export type PublicPageMeta = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

export type PublicPackageListItem = {
  id: number;
  slug: string;
  name: string;
  duration: string;
  featured: boolean;
  image: string;
  price: string;
  priceNote: string;
};

export type PublicPackageDetail = {
  id: number;
  slug: string;
  name: string;
  duration: string;
  tourType?: string;
  maxPeople?: number;
  minAge?: number;
  featured: boolean;
  priceFrom: string;
  priceNote: string;
  heroImage: string;
  seoDescription?: string;
  tourMapUrl?: string;
  overview?: string;
  priceTiers: Array<{
    minPerson: number;
    maxPerson: number;
    pricePerPerson: string;
    currency: string;
  }>;
  media: Array<{
    id: number;
    type: 'IMAGE' | 'VIDEO';
    srcUrl: string | null;
    videoEmbedUrl?: string | null;
    title?: string | null;
    caption?: string | null;
    thumbnailUrl?: string | null;
    isThumbnail?: boolean;
  }>;
  thumbnails: Array<{
    id: number;
    type: 'IMAGE' | 'VIDEO';
    srcUrl: string | null;
    videoEmbedUrl?: string | null;
    title?: string | null;
    caption?: string | null;
    thumbnailUrl?: string | null;
  }>;
  tourHighlights: string[];
  included: string[];
  excluded: string[];
  relatedPackages: Array<{ slug: string; name: string; image: string }>;
};

export type PublicAdventureListItem = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  image: string;
};

export type PublicAdventureDetail = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  relatedPackage: { slug: string; name: string; image: string } | null;
};

export type PublicPackageListParams = {
  q?: string;
  duration?: string;
  featured?: boolean;
  sort?: 'featured' | 'newest' | 'price_asc' | 'price_desc' | 'name_asc';
  limit?: number;
  offset?: number;
};

export type PublicAdventureListParams = {
  q?: string;
  limit?: number;
  offset?: number;
};

function cleanParams(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  );
}

function paramsToQueryString(params: Record<string, unknown>) {
  const searchParams = new URLSearchParams();
  const cleaned = cleanParams(params);
  for (const [k, v] of Object.entries(cleaned)) {
    searchParams.set(k, String(v));
  }
  return searchParams.toString();
}

function paramsCacheSuffix(params: Record<string, unknown>) {
  const cleaned = cleanParams(params);
  const sortedEntries = Object.entries(cleaned).sort(([a], [b]) => a.localeCompare(b));
  return JSON.stringify(sortedEntries);
}

function readCache<T>(key: string, validate: (value: unknown) => value is T): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(`${PUBLIC_CACHE_PREFIX}${key}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { ts?: number; data?: unknown };
    if (typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > PUBLIC_CACHE_TTL_MS) return null;
    if (!validate(parsed.data)) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      `${PUBLIC_CACHE_PREFIX}${key}`,
      JSON.stringify({ ts: Date.now(), data }),
    );
  } catch {
    // ignore storage failures
  }
}

function isPageMeta(value: unknown): value is PublicPageMeta {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<PublicPageMeta>;
  return (
    typeof v.total === 'number' &&
    typeof v.limit === 'number' &&
    typeof v.offset === 'number' &&
    typeof v.hasMore === 'boolean'
  );
}

function isPackageListResponse(value: unknown): value is { packages: PublicPackageListItem[]; page?: PublicPageMeta } {
  const candidate = value as { packages?: unknown[]; page?: unknown };
  if (!(value && typeof value === 'object' && Array.isArray(candidate.packages))) return false;
  if (candidate.page == null) return true;
  return isPageMeta(candidate.page);
}

function isPackageDetailResponse(value: unknown): value is { package: PublicPackageDetail } {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as { package?: { slug?: unknown } }).package &&
      typeof (value as { package: { slug: unknown } }).package.slug === 'string',
  );
}

function isAdventureListResponse(
  value: unknown,
): value is { adventures: PublicAdventureListItem[]; page?: PublicPageMeta } {
  const candidate = value as { adventures?: unknown[]; page?: unknown };
  if (!(value && typeof value === 'object' && Array.isArray(candidate.adventures))) return false;
  if (candidate.page == null) return true;
  return isPageMeta(candidate.page);
}

function isAdventureDetailResponse(value: unknown): value is { adventure: PublicAdventureDetail } {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as { adventure?: { slug?: unknown } }).adventure &&
      typeof (value as { adventure: { slug: unknown } }).adventure.slug === 'string',
  );
}

export async function fetchPublicPackages(
  params: PublicPackageListParams = {},
): Promise<{ packages: PublicPackageListItem[]; page?: PublicPageMeta }> {
  const query = paramsToQueryString(params as Record<string, unknown>);
  const cacheKey = `packages:list:${paramsCacheSuffix(params as Record<string, unknown>)}`;
  const cached = readCache(cacheKey, isPackageListResponse);
  if (cached) return cached;
  const fresh = await apiRequest<{ packages: PublicPackageListItem[]; page?: PublicPageMeta }>(
    `/api/v1/packages${query ? `?${query}` : ''}`,
  );
  writeCache(cacheKey, fresh);
  return fresh;
}

export async function fetchPublicPackageDetail(slug: string) {
  const key = `packages:detail:${slug}`;
  const cached = readCache(key, isPackageDetailResponse);
  if (cached) return cached;
  const fresh = await apiRequest<{ package: PublicPackageDetail }>(
    `/api/v1/packages/${encodeURIComponent(slug)}`,
  );
  writeCache(key, fresh);
  return fresh;
}

export async function fetchPublicAdventures(
  params: PublicAdventureListParams = {},
): Promise<{ adventures: PublicAdventureListItem[]; page?: PublicPageMeta }> {
  const query = paramsToQueryString(params as Record<string, unknown>);
  const key = `adventures:list:${paramsCacheSuffix(params as Record<string, unknown>)}`;
  const cached = readCache(key, isAdventureListResponse);
  if (cached) return cached;
  const fresh = await apiRequest<{ adventures: PublicAdventureListItem[]; page?: PublicPageMeta }>(
    `/api/v1/adventures${query ? `?${query}` : ''}`,
  );
  writeCache(key, fresh);
  return fresh;
}

export async function fetchPublicAdventureDetail(slug: string) {
  const key = `adventures:detail:${slug}`;
  const cached = readCache(key, isAdventureDetailResponse);
  if (cached) return cached;
  const fresh = await apiRequest<{ adventure: PublicAdventureDetail }>(
    `/api/v1/adventures/${encodeURIComponent(slug)}`,
  );
  writeCache(key, fresh);
  return fresh;
}

export function toAbsoluteMediaUrl(srcUrl?: string | null) {
  if (!srcUrl) return '';
  if (srcUrl.startsWith('http://') || srcUrl.startsWith('https://')) return srcUrl;
  return `${API_BASE}${srcUrl.startsWith('/') ? '' : '/'}${srcUrl}`;
}

export function toEmbeddedVideoUrl(url?: string | null) {
  const value = (url ?? '').trim();
  if (!value) return '';
  try {
    const parsed = new URL(value);
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      const shorts = parsed.pathname.match(/^\/shorts\/([^/?#]+)/);
      if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`;
      const embed = parsed.pathname.match(/^\/embed\/([^/?#]+)/);
      if (embed?.[1]) return `https://www.youtube.com/embed/${embed[1]}`;
    }
    if (parsed.hostname === 'youtu.be') {
      const shortId = parsed.pathname.replace('/', '').split('/')[0];
      if (shortId) return `https://www.youtube.com/embed/${shortId}`;
    }
    if (parsed.hostname.includes('vimeo.com')) {
      const match = parsed.pathname.match(/\/(\d+)/);
      if (match?.[1]) return `https://player.vimeo.com/video/${match[1]}`;
    }
  } catch {
    return '';
  }
  return '';
}
