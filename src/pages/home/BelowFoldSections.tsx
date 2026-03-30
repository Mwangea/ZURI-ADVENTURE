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

/**
 * Heavier homepage sections loaded in one lazy boundary to reduce initial JS and improve LCP.
 */
export default function BelowFoldSections() {
  useEffect(() => {
    ScrollTrigger.refresh();
  }, []);

  return (
    <>
      <About />
      <Packages />
      <InstagramReels />
      <Gallery />
      <Testimonials />
      <BreathSection />
      <ZigZagGrid />
      <FAQ />
    </>
  );
}
