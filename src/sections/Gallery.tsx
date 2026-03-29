import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { X, ZoomIn } from 'lucide-react';
import { galleryConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

const Gallery = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const images = galleryConfig.images;

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const grid = gridRef.current;

    if (!section || !header || !grid) return;

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

    // Grid items animation
    const gridItems = grid.querySelectorAll('.gallery-item');
    gsap.set(gridItems, { opacity: 0, y: 40, scale: 0.95 });
    const gridTrigger = ScrollTrigger.create({
      trigger: grid,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        gsap.to(gridItems, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
        });
      },
    });
    triggers.push(gridTrigger);

    return () => {
      triggers.forEach(t => t.kill());
    };
  }, []);

  const openLightbox = (image: string) => {
    setLightboxImage(image);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    document.body.style.overflow = '';
  };

  if (!galleryConfig.sectionTitle || images.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-kaleo-sand py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16">
          <span className="font-body text-sm text-kaleo-terracotta uppercase tracking-[0.2em]">
            {galleryConfig.sectionSubtitle}
          </span>
          <h2 className="font-display text-headline text-kaleo-earth mt-4">
            {galleryConfig.sectionTitle}
          </h2>
          <p className="font-body text-body text-kaleo-earth/70 mt-4 max-w-2xl mx-auto">
            {galleryConfig.description}
          </p>
        </div>

        {/* Masonry Grid */}
        <div ref={gridRef} className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="gallery-item relative group break-inside-avoid overflow-hidden rounded-2xl cursor-pointer"
              onClick={() => openLightbox(image.src)}
            >
              <img
                src={image.src}
                alt={image.alt}
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-kaleo-charcoal/0 group-hover:bg-kaleo-charcoal/40 transition-colors duration-300 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300">
                  <ZoomIn className="w-5 h-5 text-kaleo-earth" />
                </div>
              </div>
              {/* Caption */}
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <p className="font-body text-sm text-white">{image.caption}</p>
              </div>
            </div>
          ))}
        </div>

        {/* View More CTA */}
        {galleryConfig.ctaText && (
          <div className="text-center mt-12">
            <a
              href={galleryConfig.ctaLink}
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-kaleo-earth text-kaleo-earth rounded-full font-body text-sm uppercase tracking-wider hover:bg-kaleo-earth hover:text-kaleo-cream transition-all"
            >
              {galleryConfig.ctaText}
            </a>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={closeLightbox}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={lightboxImage}
            alt="Gallery"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </section>
  );
};

export default Gallery;
