import { lazy, Suspense, useEffect } from 'react';
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

const BelowFoldSections = lazy(() => import('./home/BelowFoldSections'));

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
      <main id="main-home">
        <Hero />
        <NarrativeText />
        <Suspense fallback={belowFoldFallback()}>
          <BelowFoldSections />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
