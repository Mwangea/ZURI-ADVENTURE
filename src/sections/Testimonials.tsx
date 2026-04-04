import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Star,
  MapPin,
  Compass,
  Mountain,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { testimonialsConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

/** Horizontal slide; switch to 'y' for vertical slide animations. */
const SLIDE_AXIS: 'x' | 'y' = 'x';
const AUTOPLAY_MS = 6500;
const SWIPE_PX = 48;

type TestimonialItem = {
  quote: string;
  name: string;
  location: string;
  avatar: string;
  rating: number;
  trip: string;
};

type TestimonialsOverride = {
  testimonials?: TestimonialItem[];
};

const Testimonials = ({ override }: { override?: TestimonialsOverride }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const carouselShellRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const badgesRef = useRef<HTMLDivElement>(null);

  const testimonials = override?.testimonials?.length ? override.testimonials : testimonialsConfig.testimonials;
  const [index, setIndex] = useState(0);
  const [autoplayPaused, setAutoplayPaused] = useState(false);

  const indexRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const pendingEnterRef = useRef(false);
  const dirRef = useRef<1 | -1>(1);
  const isInitialLayoutRef = useRef(true);
  const touchStartRef = useRef<number | null>(null);
  const reducedMotionRef = useRef(false);

  useEffect(() => {
    reducedMotionRef.current =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  const len = testimonials.length;
  const testimonial = len > 0 ? testimonials[index] : null;

  useLayoutEffect(() => {
    if (!pendingEnterRef.current) return;
    pendingEnterRef.current = false;
    const el = slideRef.current;
    if (!el || reducedMotionRef.current) return;

    const dir = dirRef.current;
    const from =
      SLIDE_AXIS === 'x'
        ? { opacity: 0, scale: 0.92, x: dir * 56, y: 0 }
        : { opacity: 0, scale: 0.92, x: 0, y: dir * 36 };
    gsap.fromTo(
      el,
      from,
      {
        opacity: 1,
        scale: 1,
        x: 0,
        y: 0,
        duration: 0.52,
        ease: 'power3.out',
        onComplete: () => {
          isAnimatingRef.current = false;
        },
      }
    );
  }, [index]);

  const goTo = useCallback(
    (newIndex: number, dir: 1 | -1) => {
      if (len <= 1) return;
      const normalized =
        ((newIndex % len) + len) % len;
      if (normalized === indexRef.current) return;
      if (isAnimatingRef.current) return;

      isAnimatingRef.current = true;
      dirRef.current = dir;

      const el = slideRef.current;
      if (!el || reducedMotionRef.current) {
        setIndex(normalized);
        indexRef.current = normalized;
        isAnimatingRef.current = false;
        return;
      }

      gsap.killTweensOf(el);
      const out =
        SLIDE_AXIS === 'x'
          ? { opacity: 0, scale: 0.9, x: dir * -44, y: 0 }
          : { opacity: 0, scale: 0.9, x: 0, y: dir * -28 };

      gsap.to(el, {
        ...out,
        duration: 0.36,
        ease: 'power2.in',
        onComplete: () => {
          pendingEnterRef.current = true;
          setIndex(normalized);
          indexRef.current = normalized;
        },
      });
    },
    [len]
  );

  const goNext = useCallback(() => {
    goTo(indexRef.current + 1, 1);
  }, [goTo]);

  const goPrev = useCallback(() => {
    goTo(indexRef.current - 1, -1);
  }, [goTo]);

  useEffect(() => {
    if (len <= 1 || autoplayPaused) return;
    const id = window.setInterval(() => {
      goTo(indexRef.current + 1, 1);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [len, goTo, autoplayPaused]);

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const shell = carouselShellRef.current;
    const badges = badgesRef.current;

    if (!section || !header || !shell) return;

    const triggers: ScrollTrigger[] = [];

    gsap.set(header.children, { opacity: 0, y: 28 });
    triggers.push(
      ScrollTrigger.create({
        trigger: header,
        start: 'top 82%',
        once: true,
        onEnter: () => {
          gsap.to(header.children, {
            opacity: 1,
            y: 0,
            duration: 0.75,
            stagger: 0.12,
            ease: 'power3.out',
          });
        },
      })
    );

    gsap.set(shell, { opacity: 0, y: 36 });
    triggers.push(
      ScrollTrigger.create({
        trigger: shell,
        start: 'top 78%',
        once: true,
        onEnter: () => {
          gsap.to(shell, {
            opacity: 1,
            y: 0,
            duration: 0.85,
            ease: 'power3.out',
          });
        },
      })
    );

    if (badges) {
      gsap.set(badges.children, { opacity: 0, y: 16 });
      triggers.push(
        ScrollTrigger.create({
          trigger: badges,
          start: 'top 90%',
          once: true,
          onEnter: () => {
            gsap.to(badges.children, {
              opacity: 1,
              y: 0,
              duration: 0.6,
              stagger: 0.08,
              ease: 'power2.out',
            });
          },
        })
      );
    }

    return () => {
      triggers.forEach((t) => t.kill());
    };
  }, [len]);

  useLayoutEffect(() => {
    const el = slideRef.current;
    if (!el) return;
    if (!isInitialLayoutRef.current) return;
    isInitialLayoutRef.current = false;
    if (reducedMotionRef.current) return;
    gsap.set(el, { opacity: 0, scale: 0.94, x: 0, y: 12 });
    gsap.to(el, {
      opacity: 1,
      scale: 1,
      y: 0,
      duration: 0.65,
      ease: 'power3.out',
      delay: 0.12,
    });
  }, []);

  if (!testimonialsConfig.sectionTitle || len === 0 || !testimonial) return null;

  const rotationClass = '-rotate-[0.5deg]';

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-kaleo-earth py-20 md:py-28 lg:py-32"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        aria-hidden
      >
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
          <defs>
            <pattern id="topo-testimonials" width="120" height="120" patternUnits="userSpaceOnUse">
              <path
                d="M0 60 Q30 40 60 60 T120 60 M0 90 Q40 70 80 90 T160 90 M20 0 Q50 25 80 0 T140 0"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-kaleo-cream"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topo-testimonials)" />
        </svg>
      </div>

      <div
        className="pointer-events-none absolute -right-24 top-1/4 h-72 w-72 rounded-full bg-kaleo-terracotta/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-1/4 h-64 w-64 rounded-full bg-kaleo-cream/5 blur-3xl"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6 md:px-8 lg:px-12">
        <div
          ref={headerRef}
          className="mb-10 flex flex-col gap-6 md:mb-12 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 font-body text-xs uppercase tracking-[0.25em] text-kaleo-terracotta">
              <Mountain className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span>{testimonialsConfig.sectionSubtitle}</span>
            </div>
            <h2 className="font-display text-headline text-kaleo-cream">
              {testimonialsConfig.sectionTitle}
            </h2>
            <p className="mt-4 font-body text-base leading-relaxed text-kaleo-cream/65">
              One story at a time — swipe, use the arrows, or wait for the next traveler log.
            </p>
          </div>
          <div className="hidden shrink-0 text-kaleo-terracotta/40 lg:block" aria-hidden>
            <Compass className="h-28 w-28 animate-spin-slow" strokeWidth={0.85} />
          </div>
        </div>

        <div
          ref={carouselShellRef}
          className="mx-auto max-w-3xl"
          onMouseEnter={() => len > 1 && setAutoplayPaused(true)}
          onMouseLeave={() => setAutoplayPaused(false)}
        >
          <div
            className="relative"
            onTouchStart={(e) => {
              touchStartRef.current = e.touches[0].clientX;
            }}
            onTouchEnd={(e) => {
              const start = touchStartRef.current;
              touchStartRef.current = null;
              if (start == null || len <= 1) return;
              const end = e.changedTouches[0].clientX;
              const dx = end - start;
              if (dx > SWIPE_PX) goPrev();
              else if (dx < -SWIPE_PX) goNext();
            }}
          >
            <article
              ref={slideRef}
              aria-live="polite"
              aria-atomic="true"
              className={`group relative flex flex-col border-2 border-dashed border-kaleo-terracotta/35 bg-kaleo-cream p-6 shadow-deep md:p-8 ${rotationClass}`}
            >
              <div
                className="pointer-events-none absolute right-3 top-3 text-kaleo-terracotta/[0.12] transition-opacity group-hover:opacity-80"
                aria-hidden
              >
                <Compass className="h-20 w-20" strokeWidth={1} />
              </div>

              <div className="relative mb-5 flex items-start justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 font-body text-[11px] font-medium uppercase tracking-[0.2em] text-kaleo-terracotta">
                  <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
                  {testimonial.trip}
                </span>
                <span className="rounded-sm border border-kaleo-earth/15 bg-kaleo-sand/80 px-2 py-0.5 font-body text-[10px] uppercase tracking-wider text-kaleo-earth/50">
                  Log #{String(index + 1).padStart(2, '0')} / {String(len).padStart(2, '0')}
                </span>
              </div>

              <div className="relative mb-5 aspect-[16/10] overflow-hidden rounded-sm ring-1 ring-kaleo-earth/10 sm:aspect-[5/2]">
                <img
                  src={testimonial.avatar}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-kaleo-earth/50 via-transparent to-transparent" />
              </div>

              <div className="mb-4 flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < testimonial.rating
                        ? 'fill-amber-500 text-amber-500'
                        : 'text-kaleo-earth/15'
                    }`}
                  />
                ))}
              </div>

              <blockquote className="relative flex-1 font-display text-xl leading-snug text-kaleo-earth md:text-[1.35rem]">
                <span
                  className="absolute -left-1 -top-2 font-display text-5xl leading-none text-kaleo-terracotta/25"
                  aria-hidden
                >
                  “
                </span>
                <span className="relative z-[1] pl-4">{testimonial.quote}</span>
              </blockquote>

              <div className="mt-6 flex items-center gap-3 border-t border-kaleo-earth/10 pt-5">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-kaleo-terracotta/25">
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-display text-lg text-kaleo-earth">{testimonial.name}</p>
                  <p className="font-body text-sm text-kaleo-earth/55">{testimonial.location}</p>
                </div>
              </div>
            </article>

            {len > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous testimonial"
                  onClick={() => goPrev()}
                  className="absolute left-0 top-1/2 z-10 flex h-11 w-11 -translate-x-2 -translate-y-1/2 items-center justify-center rounded-full border border-kaleo-earth/15 bg-kaleo-cream/95 text-kaleo-earth shadow-md transition hover:border-kaleo-terracotta/50 hover:bg-kaleo-cream md:-translate-x-1/2"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next testimonial"
                  onClick={() => goNext()}
                  className="absolute right-0 top-1/2 z-10 flex h-11 w-11 translate-x-2 -translate-y-1/2 items-center justify-center rounded-full border border-kaleo-earth/15 bg-kaleo-cream/95 text-kaleo-earth shadow-md transition hover:border-kaleo-terracotta/50 hover:bg-kaleo-cream md:translate-x-1/2"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}
          </div>

          {len > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Show testimonial ${i + 1}`}
                  aria-current={i === index}
                  onClick={() => goTo(i, i > index ? 1 : -1)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === index
                      ? 'w-8 bg-kaleo-terracotta'
                      : 'w-2 bg-kaleo-cream/30 hover:bg-kaleo-cream/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div
          ref={badgesRef}
          className="mt-12 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-kaleo-cream/10 pt-10 md:mt-14 md:pt-12"
        >
          {testimonialsConfig.badges?.map((badge, i) => (
            <div key={i} className="flex items-center gap-2 text-kaleo-cream/45">
              <span className="h-1 w-1 rounded-full bg-kaleo-terracotta" aria-hidden />
              <span className="font-body text-sm tracking-wide">{badge}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
