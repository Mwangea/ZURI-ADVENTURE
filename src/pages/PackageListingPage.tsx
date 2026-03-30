import { Link } from 'react-router-dom';
import { Star, Clock, Users, Car } from 'lucide-react';
import { InteriorLayout } from '@/layouts/InteriorLayout';
import { Seo } from '@/components/Seo';
import { packagesConfig, siteConfig } from '@/config';
import { getAllPackages } from '@/lib/content-registry';
import { pageTitle } from '@/lib/site';
import { breadcrumbJsonLd, travelAgencyJsonLd } from '@/lib/jsonld';

const iconMap: Record<string, typeof Star> = {
  star: Star,
  clock: Clock,
  users: Users,
  car: Car,
};

export default function PackageListingPage() {
  const packages = getAllPackages();
  const desc = `${packages.length} curated coastal Kenya packages — ${siteConfig.siteDescription}`;

  return (
    <InteriorLayout>
      <Seo
        title={pageTitle('Tour packages')}
        description={desc}
        canonicalPath="/packages"
        jsonLd={[
          travelAgencyJsonLd(),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Packages', path: '/packages' },
          ]),
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-24 lg:px-12">
        <header className="mb-14 max-w-2xl">
          <p className="font-body text-sm uppercase tracking-[0.2em] text-kaleo-terracotta">
            {packagesConfig.sectionSubtitle}
          </p>
          <h1 className="mt-3 font-display text-headline text-kaleo-earth">
            {packagesConfig.sectionTitle}
          </h1>
          <p className="mt-4 font-body text-body text-kaleo-earth/70">{packagesConfig.description}</p>
        </header>

        <ul className="grid list-none grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {packages.map((pkg) => {
            const Icon = iconMap[pkg.icon] || Star;
            return (
              <li key={pkg.slug}>
                <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-kaleo-earth/5">
                  <Link to={`/packages/${pkg.slug}`} className="relative block h-48 overflow-hidden">
                    <img
                      src={pkg.image}
                      alt={`${pkg.name} — ${pkg.duration} Kenya coast`}
                      width={800}
                      height={600}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="mb-1 flex items-center gap-2 text-white/85">
                        <Icon className="h-4 w-4" aria-hidden />
                        <span className="font-body text-xs uppercase tracking-wider">{pkg.duration}</span>
                      </div>
                      <h2 className="font-display text-xl">{pkg.name}</h2>
                    </div>
                  </Link>
                  <div className="flex flex-1 flex-col p-6">
                    <p className="font-body text-sm leading-relaxed text-kaleo-earth/75">
                      {pkg.seoDescription ?? `${pkg.name} — ${pkg.duration} adventure on the Kenya coast.`}
                    </p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-display text-2xl text-kaleo-earth">{pkg.price}</span>
                      <span className="font-body text-sm text-kaleo-earth/60">{pkg.priceNote}</span>
                    </div>
                    <Link
                      to={`/packages/${pkg.slug}`}
                      className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-kaleo-terracotta py-3 font-body text-sm uppercase tracking-wider text-white transition-colors hover:bg-kaleo-earth"
                    >
                      View package
                    </Link>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>

        <nav aria-label="Related" className="mt-16 border-t border-kaleo-earth/10 pt-10">
          <p className="font-body text-sm text-kaleo-earth/60">
            Explore{' '}
            <Link to="/adventures" className="text-kaleo-terracotta underline-offset-4 hover:underline">
              day adventures by destination
            </Link>{' '}
            or{' '}
            <Link to="/" className="text-kaleo-terracotta underline-offset-4 hover:underline">
              return home
            </Link>
            .
          </p>
        </nav>
      </div>
    </InteriorLayout>
  );
}
