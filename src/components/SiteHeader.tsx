import { Link, useLocation } from 'react-router-dom';
import { siteConfig } from '@/config';

const nav = [
  { to: '/', label: 'Home' },
  { to: '/packages', label: 'Packages' },
  { to: '/adventures', label: 'Adventures' },
  { to: '/#contact', label: 'Contact' },
];

export function SiteHeader() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-kaleo-earth/10 bg-kaleo-sand/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 md:px-8 lg:px-12">
        <Link
          to="/"
          className="font-display text-lg tracking-tight text-kaleo-earth transition-colors hover:text-kaleo-terracotta md:text-xl"
        >
          {siteConfig.siteName}
        </Link>
        <nav aria-label="Main" className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2">
          {nav.map((item) => {
            const isActive =
              item.to === '/'
                ? pathname === '/'
                : item.to.startsWith('/#')
                  ? false
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);
            return (
              <Link
                key={item.to + item.label}
                to={item.to}
                className={`font-body text-xs uppercase tracking-[0.15em] transition-colors ${
                  isActive ? 'text-kaleo-terracotta' : 'text-kaleo-earth/70 hover:text-kaleo-earth'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
