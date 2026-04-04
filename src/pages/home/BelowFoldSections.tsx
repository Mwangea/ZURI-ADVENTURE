import { useEffect } from 'react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import About from '@/sections/About';
import Packages from '@/sections/Packages';
import InstagramReels from '@/sections/InstagramReels';
import Gallery from '@/sections/Gallery';
import Testimonials from '@/sections/Testimonials';
import BreathSection from '@/sections/BreathSection';
import ZigZagGrid from '@/sections/ZigZagGrid';
import FAQ from '@/sections/FAQ';

type HomeContentOverrides = {
  testimonials?: Array<{
    quote: string;
    name: string;
    location: string;
    avatar: string;
    rating: number;
    trip: string;
  }>;
  galleryItems?: Array<{
    mediaType: 'IMAGE' | 'VIDEO';
    src: string;
    alt: string;
    caption: string;
    videoEmbedUrl?: string;
  }>;
};

/**
 * Heavier homepage sections loaded in one lazy boundary to reduce initial JS and improve LCP.
 */
export default function BelowFoldSections({ overrides }: { overrides?: HomeContentOverrides }) {
  useEffect(() => {
    ScrollTrigger.refresh();
  }, []);

  return (
    <>
      <About />
      <Packages />
      <InstagramReels />
      <Gallery override={{ items: overrides?.galleryItems }} />
      <Testimonials override={{ testimonials: overrides?.testimonials }} />
      <BreathSection />
      <ZigZagGrid />
      <FAQ />
    </>
  );
}
