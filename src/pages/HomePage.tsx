import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useLenis from '@/hooks/useLenis';
import { Seo } from '@/components/Seo';
import { heroConfig, siteConfig } from '@/config';
import Hero from '@/sections/Hero';
import NarrativeText from '@/sections/NarrativeText';
import Footer from '@/sections/Footer';
import {
  travelAgencyJsonLd,
  webSiteJsonLd,
  faqPageJsonLd,
} from '@/lib/jsonld';
import { pageTitle } from '@/lib/site';
import { apiRequest, API_BASE } from '@/lib/api';

const BelowFoldSections = lazy(() => import('./home/BelowFoldSections'));
const PROMO_DISMISS_KEY = 'zuri.public.promo.dismissed';

type HomeContentResponse = {
  hero: {
    title?: string;
    subtitle?: string;
    cta_link?: string;
    cta_label?: string;
    background_image_url?: string | null;
  } | null;
  testimonials: Array<{
    quote: string;
    author_name: string;
    location: string | null;
    avatar_url: string | null;
    rating: number | null;
    trip_label: string | null;
  }>;
  promoBanner: {
    message?: string | null;
    image_url?: string | null;
    cta_label?: string | null;
    cta_link?: string | null;
  } | null;
  gallery: Array<{
    media_type: 'IMAGE' | 'VIDEO';
    src_url: string | null;
    video_embed_url?: string | null;
    title: string | null;
    caption: string | null;
  }>;
};

function toAbsoluteMediaUrl(srcUrl?: string | null) {
  if (!srcUrl) return '';
  if (srcUrl.startsWith('http://') || srcUrl.startsWith('https://')) return srcUrl;
  return `${API_BASE}${srcUrl.startsWith('/') ? '' : '/'}${srcUrl}`;
}

gsap.registerPlugin(ScrollTrigger);

function belowFoldFallback() {
  return (
    <div
      className="min-h-[40vh] w-full bg-kaleo-sand"
      aria-hidden
    />
  );
}

export default function HomePage() {
  useLenis();
  const [content, setContent] = useState<HomeContentResponse | null>(null);
  const [dismissedPromoId, setDismissedPromoId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(PROMO_DISMISS_KEY);
  });

  useEffect(() => {
    if (siteConfig.language) {
      document.documentElement.lang = siteConfig.language;
    }

    const handleLoad = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener('load', handleLoad);
    const refreshTimeout = window.setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);

    return () => {
      window.removeEventListener('load', handleLoad);
      window.clearTimeout(refreshTimeout);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiRequest<HomeContentResponse>('/api/v1/content/home');
        if (!cancelled) setContent(data);
      } catch {
        // fallback stays on static config
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const heroOverride = useMemo(() => {
    const hero = content?.hero;
    if (!hero) return undefined;
    return {
      title: hero.title || heroConfig.title,
      subtitle: hero.subtitle || heroConfig.subtitle,
      backgroundImage: hero.background_image_url
        ? toAbsoluteMediaUrl(hero.background_image_url)
        : heroConfig.backgroundImage,
      backgroundAlt: heroConfig.backgroundAlt,
    };
  }, [content?.hero]);

  const testimonialsOverride = useMemo(() => {
    const rows = content?.testimonials ?? [];
    if (!rows.length) return undefined;
    return rows.map((t) => ({
      quote: t.quote,
      name: t.author_name,
      location: t.location || 'Guest',
      avatar: toAbsoluteMediaUrl(t.avatar_url) || '/hero-bg.jpg',
      rating: Math.max(1, Math.min(5, Number(t.rating ?? 5))),
      trip: t.trip_label || 'Zuri Adventure',
    }));
  }, [content?.testimonials]);

  const galleryItemsOverride = useMemo(() => {
    const rows = content?.gallery ?? [];
    const items = rows
      .filter((m) => (m.media_type === 'IMAGE' && m.src_url) || (m.media_type === 'VIDEO' && (m.src_url || m.video_embed_url)))
      .map((m) => ({
        mediaType: m.media_type,
        src: toAbsoluteMediaUrl(m.src_url),
        videoEmbedUrl: m.video_embed_url || undefined,
        alt: m.title || m.caption || (m.media_type === 'VIDEO' ? 'Gallery video' : 'Gallery image'),
        caption: m.caption || m.title || '',
      }));
    return items.length ? items : undefined;
  }, [content?.gallery]);

  const promo = content?.promoBanner ?? null;
  const promoId = useMemo(() => {
    if (!promo) return '';
    return [
      promo.message ?? '',
      promo.image_url ?? '',
      promo.cta_label ?? '',
      promo.cta_link ?? '',
    ].join('|');
  }, [promo]);
  const showPromoModal = Boolean(promo && promoId && dismissedPromoId !== promoId);

  return (
    <div className="relative bg-kaleo-sand">
      <Seo
        title={pageTitle(siteConfig.siteName)}
        description={siteConfig.siteDescription}
        canonicalPath="/"
        ogImage={heroConfig.backgroundImage}
        ogImageAlt={heroConfig.backgroundAlt}
        jsonLd={[travelAgencyJsonLd(), webSiteJsonLd(), faqPageJsonLd()]}
      />
      <a
        href="#main-home"
        className="pointer-events-none fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-md bg-kaleo-earth px-4 py-2 font-body text-sm text-kaleo-cream opacity-0 ring-2 ring-kaleo-terracotta transition-all focus:pointer-events-auto focus:translate-y-0 focus:opacity-100 focus:outline-none"
      >
        Skip to content
      </a>
      {showPromoModal ? (
        <div className="fixed inset-0 z-[120] grid place-items-center bg-black/55 p-4">
          <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-kaleo-cream shadow-2xl">
            {promo?.image_url ? (
              <img
                src={toAbsoluteMediaUrl(promo.image_url)}
                alt="Promo banner"
                className="h-48 w-full object-cover sm:h-56"
              />
            ) : null}
            <div className="space-y-4 p-5 sm:p-6">
              <p className="font-body text-sm text-kaleo-earth sm:text-base">
                {promo?.message || 'Special offer available now.'}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {promo?.cta_link ? (
                  <a
                    href={promo.cta_link}
                    className="rounded-full bg-kaleo-terracotta px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white"
                  >
                    {promo.cta_label || 'View offer'}
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    if (!promoId) return;
                    setDismissedPromoId(promoId);
                    if (typeof window !== 'undefined') {
                      window.localStorage.setItem(PROMO_DISMISS_KEY, promoId);
                    }
                  }}
                  className="rounded-full border border-kaleo-earth/25 px-4 py-2 text-xs uppercase tracking-wider text-kaleo-earth"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      <main id="main-home">
        <Hero override={heroOverride} />
        <NarrativeText />
        <Suspense fallback={belowFoldFallback()}>
          <BelowFoldSections overrides={{ testimonials: testimonialsOverride, galleryItems: galleryItemsOverride }} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
