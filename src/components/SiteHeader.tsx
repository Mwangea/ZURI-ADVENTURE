import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { siteConfig } from '@/config';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/', label: 'Home' },
  { to: '/packages', label: 'Packages' },
  { to: '/adventures', label: 'Adventures' },
  { to: '/#contact', label: 'Contact' },
] as const;

function isNavActive(pathname: string, to: string) {
  if (to === '/') return pathname === '/';
  if (to.startsWith('/#')) return false;
  return pathname === to || pathname.startsWith(`${to}/`);
}

export type SiteHeaderProps = {
  /** Interior pages: sticky bar. Home: fixed + slide in when `revealOpen` is true. */
  position?: 'sticky' | 'fixed';
  /** When `position="fixed"`, show the bar (translate in). Parent controls scroll logic. */
  revealOpen?: boolean;
};

export function SiteHeader({ position = 'sticky', revealOpen = false }: SiteHeaderProps) {
  const { pathname } = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const positionClass =
    position === 'fixed'
      ? `fixed inset-x-0 top-0 z-50 transition-transform duration-300 ease-out will-change-transform ${
          revealOpen ? 'translate-y-0' : '-translate-y-full pointer-events-none'
        }`
      : 'sticky top-0 z-50';

  const linkClass = (to: string) =>
    cn(
      'font-body text-xs uppercase tracking-[0.15em] transition-colors',
      isNavActive(pathname, to)
        ? 'text-kaleo-terracotta'
        : 'text-kaleo-earth/70 hover:text-kaleo-earth',
    );

  return (
    <header
      className={cn(
        positionClass,
        'border-b border-white/30 bg-kaleo-sand/45 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.35)] backdrop-blur-2xl backdrop-saturate-150',
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 md:px-8 md:py-2.5 lg:px-12 lg:py-2">
        <Link
          to="/"
          className="flex shrink-0 items-center rounded-sm transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-kaleo-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        >
          <img
            src="/zuri-logo.png"
            alt={siteConfig.siteName}
            className="h-12 w-auto max-w-[min(100%,14rem)] object-contain object-left sm:h-14 md:h-[4.5rem] md:max-w-[min(100%,16rem)] lg:h-14 lg:max-w-[min(100%,15rem)]"
          />
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <nav aria-label="Main" className="hidden items-center gap-x-5 md:flex">
            {nav.map((item) => (
              <Link key={item.to + item.label} to={item.to} className={linkClass(item.to)}>
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-kaleo-earth transition-colors hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-kaleo-terracotta focus-visible:ring-offset-2 focus-visible:ring-offset-transparent md:hidden"
            aria-label="Open navigation menu"
            aria-haspopup="dialog"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-6" strokeWidth={1.75} aria-hidden />
          </button>
        </div>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="right"
          className="w-[min(100%,20rem)] border-l border-white/25 bg-kaleo-cream/80 backdrop-blur-2xl backdrop-saturate-150 sm:max-w-sm"
        >
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-lg text-kaleo-earth">Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-2 pb-8" aria-label="Main">
            {nav.map((item) => (
              <SheetClose key={item.to + item.label} asChild>
                <Link
                  to={item.to}
                  className={cn(
                    'rounded-lg px-3 py-3.5 font-body text-sm uppercase tracking-[0.15em] transition-colors',
                    isNavActive(pathname, item.to)
                      ? 'bg-kaleo-terracotta/10 text-kaleo-terracotta'
                      : 'text-kaleo-earth/80 hover:bg-white/40 hover:text-kaleo-earth',
                  )}
                >
                  {item.label}
                </Link>
              </SheetClose>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
}
