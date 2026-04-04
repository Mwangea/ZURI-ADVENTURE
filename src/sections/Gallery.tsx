import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { X, ZoomIn, PlayCircle } from 'lucide-react';
import { galleryConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

type GalleryItem = {
  mediaType: 'IMAGE' | 'VIDEO';
  src: string;
  alt: string;
  caption: string;
  videoEmbedUrl?: string;
};
type GalleryOverride = {
  sectionTitle?: string;
  sectionSubtitle?: string;
  description?: string;
  items?: GalleryItem[];
};

const Gallery = ({ override }: { override?: GalleryOverride }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxLoadFailed, setLightboxLoadFailed] = useState(false);
  const [openError, setOpenError] = useState('');

  const data = {
    sectionTitle: override?.sectionTitle || galleryConfig.sectionTitle,
    sectionSubtitle: override?.sectionSubtitle || galleryConfig.sectionSubtitle,
    description: override?.description || galleryConfig.description,
    items: override?.items?.length
      ? override.items
      : galleryConfig.images.map((img) => ({
          mediaType: 'IMAGE' as const,
          src: img.src,
          alt: img.alt,
          caption: img.caption,
        })),
    ctaText: galleryConfig.ctaText,
    ctaLink: galleryConfig.ctaLink,
  };
  const items = data.items;

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
    // If a previous click left the lightbox open, clear it immediately first.
    setLightboxLoadFailed(false);
    setOpenError('');
    setLightboxImage(null);
    document.body.style.overflow = '';

    if (!image) {
      setOpenError('This media item has no valid URL.');
      return;
    }
    const probe = new Image();
    probe.onload = () => {
      setLightboxLoadFailed(false);
      setLightboxImage(image);
      document.body.style.overflow = 'hidden';
    };
    probe.onerror = () => {
      setLightboxImage(null);
      setOpenError('Unable to open this media item. Please upload it again.');
    };
    probe.src = image;
  };

  const closeLightbox = () => {
    setLightboxImage(null);
    document.body.style.overflow = '';
  };

  if (!data.sectionTitle || items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-kaleo-sand py-20 md:py-32"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12">
        {/* Header */}
        <div ref={headerRef} className="text-center mb-16">
          <span className="font-body text-sm text-kaleo-terracotta uppercase tracking-[0.2em]">
            {data.sectionSubtitle}
          </span>
          <h2 className="font-display text-headline text-kaleo-earth mt-4">
            {data.sectionTitle}
          </h2>
          <p className="font-body text-body text-kaleo-earth/70 mt-4 max-w-2xl mx-auto">
            {data.description}
          </p>
        </div>

        {/* Masonry Grid — images flow in columns; videos use a narrow portrait “reel” frame */}
        <div ref={gridRef} className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
          {items.map((item, index) => {
            const isVideo = item.mediaType === 'VIDEO';
            const reelFrame =
              'relative w-full aspect-[9/16] overflow-hidden rounded-2xl bg-black shadow-[0_12px_40px_-8px_rgba(0,0,0,0.35)] ring-1 ring-black/10';
            return (
            <div
              key={index}
              className={`gallery-item group break-inside-avoid ${
                isVideo
                  ? 'relative mx-auto mb-2 w-full max-w-[min(100%,280px)] sm:max-w-[300px]'
                  : 'relative cursor-pointer overflow-hidden rounded-2xl'
              }`}
              onClick={() => (item.mediaType === 'IMAGE' ? openLightbox(item.src) : undefined)}
            >
              {item.mediaType === 'IMAGE' ? (
                <img
                  src={item.src}
                  alt={item.alt}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
                />
              ) : item.videoEmbedUrl ? (
                <div className={reelFrame}>
                  {/* Scale 16:9 embed to cover 9:16 (≈256/81) */}
                  <iframe
                    src={item.videoEmbedUrl}
                    title={item.alt}
                    className="absolute left-1/2 top-1/2 aspect-video w-full border-0 [transform:translate(-50%,-50%)_scale(3.17)] [transform-origin:center]"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className={reelFrame}>
                  <video
                    src={item.src}
                    className="h-full w-full object-cover"
                    controls
                    playsInline
                    preload="metadata"
                  />
                </div>
              )}
              {/* Overlay — must not block video controls / embed */}
              <div
                className={`absolute inset-0 bg-kaleo-charcoal/0 group-hover:bg-kaleo-charcoal/40 transition-colors duration-300 flex items-center justify-center ${
                  isVideo ? 'pointer-events-none rounded-2xl' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-300">
                  {item.mediaType === 'IMAGE' ? (
                    <ZoomIn className="w-5 h-5 text-kaleo-earth" />
                  ) : (
                    <PlayCircle className="w-5 h-5 text-kaleo-earth" />
                  )}
                </div>
              </div>
              {/* Caption */}
              <div
                className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  isVideo ? 'pointer-events-none rounded-b-2xl' : ''
                }`}
              >
                <p className="font-body text-sm text-white">{item.caption}</p>
              </div>
            </div>
            );
          })}
        </div>
        {openError ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {openError}
          </p>
        ) : null}

        {/* View More CTA */}
        {data.ctaText && (
          <div className="text-center mt-12">
            <a
              href={data.ctaLink}
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-kaleo-earth text-kaleo-earth rounded-full font-body text-sm uppercase tracking-wider hover:bg-kaleo-earth hover:text-kaleo-cream transition-all"
            >
              {data.ctaText}
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
            title="Close gallery lightbox"
            aria-label="Close gallery lightbox"
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={closeLightbox}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          {!lightboxLoadFailed ? (
            <img
              src={lightboxImage}
              alt="Gallery"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onError={() => setLightboxLoadFailed(true)}
            />
          ) : (
            <div
              className="max-w-md rounded-xl border border-white/20 bg-black/50 p-5 text-center text-white"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-body text-sm">
                Unable to load this media file. Please verify the gallery URL or upload again.
              </p>
              <button
                type="button"
                onClick={closeLightbox}
                className="mt-4 rounded-full border border-white/40 px-4 py-2 text-xs uppercase tracking-wider"
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default Gallery;
