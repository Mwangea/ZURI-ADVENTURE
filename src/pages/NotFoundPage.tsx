import { Link } from 'react-router-dom';
import { InteriorLayout } from '@/layouts/InteriorLayout';
import { Seo } from '@/components/Seo';
import { siteConfig } from '@/config';
import { pageTitle } from '@/lib/site';

export default function NotFoundPage() {
  return (
    <InteriorLayout>
      <Seo
        title={pageTitle('Page not found')}
        description={`The page you requested is not part of ${siteConfig.siteName}. Explore packages and adventures instead.`}
        canonicalPath="/404"
        noindex
      />
      <div className="mx-auto max-w-lg px-6 py-24 text-center md:py-32">
        <h1 className="font-display text-headline text-kaleo-earth">404</h1>
        <p className="mt-4 font-body text-kaleo-earth/70">
          This page doesn&apos;t exist or has moved. Try one of the links below.
        </p>
        <nav aria-label="Suggested pages" className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            to="/"
            className="rounded-full bg-kaleo-terracotta px-6 py-3 font-body text-sm uppercase tracking-wider text-white hover:bg-kaleo-earth"
          >
            Home
          </Link>
          <Link
            to="/packages"
            className="rounded-full border border-kaleo-earth/20 px-6 py-3 font-body text-sm uppercase tracking-wider text-kaleo-earth hover:border-kaleo-terracotta"
          >
            Packages
          </Link>
          <Link
            to="/adventures"
            className="rounded-full border border-kaleo-earth/20 px-6 py-3 font-body text-sm uppercase tracking-wider text-kaleo-earth hover:border-kaleo-terracotta"
          >
            Adventures
          </Link>
        </nav>
      </div>
    </InteriorLayout>
  );
}
