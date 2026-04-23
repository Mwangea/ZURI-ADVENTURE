import { useEffect, useRef } from 'react';
import Lenis from '@studio-freight/lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export type UseLenisOptions = {
  /** Runs on every Lenis scroll tick (after ScrollTrigger.update). Use for scroll-direction UI. */
  onLenisScroll?: (lenis: Lenis) => void;
};

export const useLenis = (options?: UseLenisOptions) => {
  const lenisRef = useRef<Lenis | null>(null);
  const onLenisScrollRef = useRef(options?.onLenisScroll);
  onLenisScrollRef.current = options?.onLenisScroll;

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    const handleLenisScroll = () => {
      ScrollTrigger.update();
      onLenisScrollRef.current?.(lenis);
    };

    lenis.on('scroll', handleLenisScroll);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000);
      });
    };
  }, []);

  return lenisRef;
};

export default useLenis;
