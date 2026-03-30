import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Compass, Heart, Shield, Users } from 'lucide-react';
import { aboutConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

const iconMap: Record<string, typeof Compass> = {
  compass: Compass,
  heart: Heart,
  shield: Shield,
  users: Users,
};

const About = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    const image = imageRef.current;
    const stats = statsRef.current;

    if (!section || !content || !image || !stats) return;

    const triggers: ScrollTrigger[] = [];

    // Content animation
    gsap.set(content.children, { opacity: 0, y: 40 });
    const contentTrigger = ScrollTrigger.create({
      trigger: content,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        gsap.to(content.children, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
        });
      },
    });
    triggers.push(contentTrigger);

    // Image parallax
    const imageTrigger = ScrollTrigger.create({
      trigger: image,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      onUpdate: (self) => {
        const img = image.querySelector('img');
        if (img) {
          gsap.set(img, { y: self.progress * 50 - 25 });
        }
      },
    });
    triggers.push(imageTrigger);

    // Stats animation
    const statItems = stats.querySelectorAll('.stat-item');
    gsap.set(statItems, { opacity: 0, y: 30 });
    const statsTrigger = ScrollTrigger.create({
      trigger: stats,
      start: 'top 80%',
      once: true,
      onEnter: () => {
        gsap.to(statItems, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
        });
      },
    });
    triggers.push(statsTrigger);

    return () => {
      triggers.forEach(t => t.kill());
    };
  }, []);

  if (!aboutConfig.title) return null;

  return (
    <section
      id="about"
      ref={sectionRef}
      className="relative w-full bg-kaleo-sand py-20 md:py-32 overflow-hidden"
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-kaleo-cream/30 -skew-x-12 translate-x-1/4" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image Column */}
          <div ref={imageRef} className="relative order-2 lg:order-1">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-deep">
              <img
                src={aboutConfig.image}
                alt={aboutConfig.imageAlt}
                className="w-full h-full object-cover"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-kaleo-charcoal/30 via-transparent to-transparent" />
            </div>
            {/* Floating badge */}
            <div className="absolute -bottom-6 -right-6 md:bottom-8 md:-right-8 bg-kaleo-terracotta text-white px-6 py-4 rounded-2xl shadow-lg">
              <p className="font-display text-3xl md:text-4xl">{aboutConfig.yearsExperience}+</p>
              <p className="font-body text-xs uppercase tracking-wider">Years Experience</p>
            </div>
          </div>

          {/* Content Column */}
          <div ref={contentRef} className="order-1 lg:order-2">
            <span className="font-body text-sm text-kaleo-terracotta uppercase tracking-[0.2em]">
              {aboutConfig.subtitle}
            </span>
            <h2 className="font-display text-headline text-kaleo-earth mt-4 mb-6">
              {aboutConfig.title}
            </h2>
            <p className="font-body text-body text-kaleo-earth/70 leading-relaxed mb-8">
              {aboutConfig.description}
            </p>

            {/* Values */}
            <div className="grid grid-cols-2 gap-4 mb-10">
              {aboutConfig.values.map((value, index) => {
                const Icon = iconMap[value.icon] || Compass;
                return (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-kaleo-terracotta/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-kaleo-terracotta" />
                    </div>
                    <div>
                      <h4 className="font-display text-lg text-kaleo-earth">{value.title}</h4>
                      <p className="font-body text-xs text-kaleo-earth/60 mt-1">{value.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* CTA */}
            <a
              href={aboutConfig.ctaLink}
              className="inline-flex items-center gap-2 px-8 py-4 bg-kaleo-earth text-kaleo-cream rounded-full font-body text-sm uppercase tracking-wider hover:bg-kaleo-terracotta transition-colors"
            >
              {aboutConfig.ctaText}
            </a>
          </div>
        </div>

        {/* Stats Row */}
        <div ref={statsRef} className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20 pt-12 border-t border-kaleo-earth/10">
          {aboutConfig.stats.map((stat, index) => (
            <div key={index} className="stat-item text-center">
              <p className="font-display text-4xl md:text-5xl text-kaleo-terracotta">{stat.value}</p>
              <p className="font-body text-sm text-kaleo-earth/60 mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default About;
