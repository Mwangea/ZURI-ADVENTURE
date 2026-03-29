import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Play, Volume2, VolumeX, Heart, MessageCircle, Send, Bookmark } from 'lucide-react';
import { instagramReelsConfig } from '../config';

gsap.registerPlugin(ScrollTrigger);

interface ReelItem {
  id: number;
  videoUrl: string;
  thumbnail: string;
  title: string;
  description: string;
  likes: string;
  comments: string;
}

const InstagramReels = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const reelsContainerRef = useRef<HTMLDivElement>(null);
  const [playingReel, setPlayingReel] = useState<number | null>(null);
  const [mutedReels, setMutedReels] = useState<Set<number>>(new Set());

  const reels = instagramReelsConfig.reels;

  useEffect(() => {
    const section = sectionRef.current;
    const header = headerRef.current;
    const reelsContainer = reelsContainerRef.current;

    if (!section || !header || !reelsContainer) return;

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

    // Reels stagger animation
    const reelCards = reelsContainer.querySelectorAll('.reel-card');
    gsap.set(reelCards, { opacity: 0, y: 50, scale: 0.95 });

    const reelsTrigger = ScrollTrigger.create({
      trigger: reelsContainer,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        gsap.to(reelCards, {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.2,
          ease: 'power3.out',
        });
      },
    });

    return () => {
      headerTrigger.kill();
      reelsTrigger.kill();
    };
  }, []);

  const togglePlay = (id: number) => {
    setPlayingReel(playingReel === id ? null : id);
  };

  const toggleMute = (id: number) => {
    setMutedReels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (!instagramReelsConfig.sectionTitle && reels.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="relative w-full bg-kaleo-sand py-20 md:py-32"
    >
      {/* Section Header */}
      <div ref={headerRef} className="text-center mb-12 md:mb-20 px-6">
        <h2 className="font-display text-headline text-kaleo-earth">
          {instagramReelsConfig.sectionTitle}
        </h2>
        <p className="font-body text-sm text-kaleo-terracotta uppercase tracking-[0.2em] mt-4">
          {instagramReelsConfig.sectionSubtitle}
        </p>
      </div>

      {/* Instagram-style Reels Grid */}
      <div 
        ref={reelsContainerRef}
        className="max-w-7xl mx-auto px-6 md:px-8 lg:px-12"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {reels.map((reel: ReelItem) => (
            <div
              key={reel.id}
              className="reel-card group relative"
            >
              {/* Phone Frame */}
              <div className="relative mx-auto bg-kaleo-charcoal rounded-[2rem] p-2 shadow-2xl max-w-[280px]">
                {/* Phone Screen */}
                <div className="relative bg-black rounded-[1.5rem] overflow-hidden aspect-[9/16]">
                  {/* Video/Image */}
                  <div className="absolute inset-0">
                    {reel.videoUrl ? (
                      <video
                        src={reel.videoUrl}
                        poster={reel.thumbnail}
                        className="w-full h-full object-cover"
                        loop
                        playsInline
                        muted={mutedReels.has(reel.id)}
                        autoPlay={playingReel === reel.id}
                      />
                    ) : (
                      <img
                        src={reel.thumbnail}
                        alt={reel.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/60" />

                  {/* Top Bar */}
                  <div className="absolute top-0 left-0 right-0 p-3 flex items-center justify-between">
                    <span className="text-white/80 text-xs font-body">Reels</span>
                    <button 
                      onClick={() => toggleMute(reel.id)}
                      className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center hover:bg-black/60 transition-colors"
                    >
                      {mutedReels.has(reel.id) ? (
                        <VolumeX className="w-4 h-4 text-white" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </div>

                  {/* Play Button (when not playing) */}
                  {reel.videoUrl && playingReel !== reel.id && (
                    <button
                      onClick={() => togglePlay(reel.id)}
                      className="absolute inset-0 flex items-center justify-center z-10"
                    >
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Play className="w-8 h-8 text-white fill-white ml-1" />
                      </div>
                    </button>
                  )}

                  {/* Pause overlay (when playing) */}
                  {reel.videoUrl && playingReel === reel.id && (
                    <button
                      onClick={() => togglePlay(reel.id)}
                      className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center">
                          <div className="w-4 h-8 border-l-2 border-r-2 border-white" />
                        </div>
                      </div>
                    </button>
                  )}

                  {/* Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    {/* Title & Description */}
                    <h3 className="font-display text-lg text-white mb-1">
                      {reel.title}
                    </h3>
                    <p className="font-body text-xs text-white/70 line-clamp-2 mb-3">
                      {reel.description}
                    </p>

                    {/* Instagram-style Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1 text-white/80 hover:text-white transition-colors">
                          <Heart className="w-5 h-5" />
                          <span className="text-xs font-body">{reel.likes}</span>
                        </button>
                        <button className="flex items-center gap-1 text-white/80 hover:text-white transition-colors">
                          <MessageCircle className="w-5 h-5" />
                          <span className="text-xs font-body">{reel.comments}</span>
                        </button>
                        <button className="text-white/80 hover:text-white transition-colors">
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                      <button className="text-white/80 hover:text-white transition-colors">
                        <Bookmark className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Side Actions (Instagram style on right) */}
                  <div className="absolute right-2 bottom-20 flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-[2px]">
                      <div className="w-full h-full rounded-full bg-kaleo-charcoal flex items-center justify-center">
                        <span className="text-white text-xs font-body">ZA</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone Notch */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-kaleo-charcoal rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instagram Link CTA */}
      <div className="text-center mt-12 md:mt-16 px-6">
        <a 
          href={instagramReelsConfig.instagramLink || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 rounded-full text-white font-body text-sm uppercase tracking-wider hover:shadow-lg hover:scale-105 transition-all"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
          Follow Us on Instagram
        </a>
      </div>
    </section>
  );
};

export default InstagramReels;
