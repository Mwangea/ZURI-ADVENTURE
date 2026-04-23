import type { ReactNode } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import Footer from '@/sections/Footer';

export function InteriorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen bg-kaleo-sand">
      <a
        href="#main-content"
        className="pointer-events-none fixed left-4 top-4 z-[100] -translate-y-[200%] rounded-md bg-kaleo-earth px-4 py-2 font-body text-sm text-white opacity-0 ring-2 ring-kaleo-terracotta transition-all focus:pointer-events-auto focus:translate-y-0 focus:opacity-100 focus:outline-none"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main-content">{children}</main>
      <Footer />
    </div>
  );
}
