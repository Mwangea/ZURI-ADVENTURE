import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import useLenis from './hooks/useLenis';
import { siteConfig } from './config';

// Sections
import Hero from './sections/Hero';
import NarrativeText from './sections/NarrativeText';
import About from './sections/About';
import Packages from './sections/Packages';
import InstagramReels from './sections/InstagramReels';
import Gallery from './sections/Gallery';
import Testimonials from './sections/Testimonials';
import FAQ from './sections/FAQ';
import BreathSection from './sections/BreathSection';
import ZigZagGrid from './sections/ZigZagGrid';
import Footer from './sections/Footer';
import { BookingModalProvider } from './components/BookingModalProvider';

gsap.registerPlugin(ScrollTrigger);

function App() {
  // Initialize Lenis smooth scrolling
  useLenis();

  useEffect(() => {
    // Set document language if configured
    if (siteConfig.language) {
      document.documentElement.lang = siteConfig.language;
    }

    // Refresh ScrollTrigger after all content is loaded
    const handleLoad = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener('load', handleLoad);

    // Also refresh after a short delay to ensure images are loaded
    const refreshTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 500);

    return () => {
      window.removeEventListener('load', handleLoad);
      clearTimeout(refreshTimeout);
    };
  }, []);

  return (
    <BookingModalProvider>
      <div className="relative bg-kaleo-sand">
      {/* Hero Section */}
      <Hero />

      {/* Narrative Text Section */}
      <NarrativeText />

      {/* About / Our Story Section */}
      <About />

      {/* Packages / Pricing Section */}
      <Packages />

      {/* Instagram-style Reels Gallery */}
      <InstagramReels />

      {/* Photo Gallery Section */}
      <Gallery />

      {/* Testimonials Section */}
      <Testimonials />

      

      {/* BREATH Video Mask Section */}
      <BreathSection />

      {/* Zig-Zag Grid - Detailed Adventures */}
      <ZigZagGrid />
      {/* FAQ Section */}
      <FAQ />

      {/* Footer */}
      <Footer />
      </div>
    </BookingModalProvider>
  );
}

export default App;
