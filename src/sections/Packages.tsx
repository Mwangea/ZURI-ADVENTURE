import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Check, Star, Clock, Users, Car } from 'lucide-react';
import { packagesConfig } from '../config';
import { useBookingModal } from '../components/BookingModalProvider';

gsap.registerPlugin(ScrollTrigger);

const iconMap: Record<string, typeof Star> = {
  star: Star,
  clock: Clock,
  users: Users,
  car: Car,
};

const Packages = () => {
  const { openBooking } = useBookingModal();
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  const packages = packagesConfig.packages;

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const cards = cardsRef.current;

    if (!section || !header || !cards) return;

    const triggers: ScrollTrigger[] = [];

    // Header animation
    gsap.set(header.children, { opacity: 0, y: 30 });
    const headerTrigger = ScrollTrigger.create({
      trigger: header,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to(header.children, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
        });
      },
    });
    triggers.push(headerTrigger);

    // Cards animation
    const cardItems = cards.querySelectorAll('.package-card');
    gsap.set(cardItems, { opacity: 0, y: 50 });
    const cardsTrigger = ScrollTrigger.create({
      trigger: cards,
      start: 'top 70%',
      once: true,
      onEnter: () => {
        gsap.to(cardItems, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
        });
      },
    });
    triggers.push(cardsTrigger);

    return () => {
      triggers.forEach(t => t.kill());
    };
  }, []);

  if (!packagesConfig.sectionTitle || packages.length === 0) return null;

  return (
    <section
      id="packages"
      ref={sectionRef}
      className="relative w-full bg-kaleo-sand py-20 md:py-32 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-kaleo-cream/50 to-transparent" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16">
          <span className="font-body text-sm text-kaleo-terracotta uppercase tracking-[0.2em]">
            {packagesConfig.sectionSubtitle}
          </span>
          <h2 className="font-display text-headline text-kaleo-earth mt-4">
            {packagesConfig.sectionTitle}
          </h2>
          <p className="font-body text-body text-kaleo-earth/70 mt-4 max-w-2xl mx-auto">
            {packagesConfig.description}
          </p>
        </div>

        {/* Package Cards */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packages.map((pkg) => {
            const Icon = iconMap[pkg.icon] || Star;
            return (
              <div
                key={pkg.slug}
                className={`package-card relative bg-white rounded-3xl overflow-hidden shadow-lg hover:shadow-deep transition-shadow ${
                  pkg.featured ? 'ring-2 ring-kaleo-terracotta' : ''
                }`}
              >
                {/* Featured badge */}
                {pkg.featured && (
                  <div className="absolute top-4 right-4 bg-kaleo-terracotta text-white px-3 py-1 rounded-full text-xs font-body uppercase tracking-wider">
                    Popular
                  </div>
                )}

                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={pkg.image}
                    alt={`${pkg.name} — ${pkg.duration} coastal Kenya tour`}
                    width={800}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="flex items-center gap-2 text-white/80 mb-1">
                      <Icon className="w-4 h-4" />
                      <span className="font-body text-xs uppercase tracking-wider">{pkg.duration}</span>
                    </div>
                    <h3 className="font-display text-xl text-white">
                      <Link
                        to={`/packages/${pkg.slug}`}
                        className="hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                      >
                        {pkg.name}
                      </Link>
                    </h3>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Price */}
                  <div className="mb-4">
                    <span className="font-display text-3xl text-kaleo-earth">{pkg.price}</span>
                    <span className="font-body text-sm text-kaleo-earth/60"> {pkg.priceNote}</span>
                  </div>

                  {/* Features */}
                  <ul className="space-y-3 mb-6">
                    {pkg.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-kaleo-terracotta flex-shrink-0 mt-0.5" />
                        <span className="font-body text-sm text-kaleo-earth/70">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-col gap-2">
                    <Link
                      to={`/packages/${pkg.slug}`}
                      className="block w-full text-center py-3 rounded-full font-body text-sm uppercase tracking-wider border border-kaleo-earth/15 text-kaleo-earth hover:bg-kaleo-earth/5 transition-colors"
                    >
                      Full details
                    </Link>
                    <button
                      type="button"
                      onClick={() => openBooking({ packageName: pkg.name })}
                      className={`block w-full text-center py-3 rounded-full font-body text-sm uppercase tracking-wider transition-colors cursor-pointer ${
                        pkg.featured
                          ? 'bg-kaleo-terracotta text-white hover:bg-kaleo-earth'
                          : 'bg-kaleo-sand text-kaleo-earth hover:bg-kaleo-earth hover:text-white'
                      }`}
                    >
                      {pkg.ctaText}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Note */}
        <div className="text-center mt-12">
          <p className="font-body text-sm text-kaleo-earth/50">
            {packagesConfig.footerNote}
          </p>
        </div>
      </div>
    </section>
  );
};

export default Packages;
