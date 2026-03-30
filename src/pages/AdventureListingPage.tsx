import { Link } from 'react-router-dom';
import { InteriorLayout } from '@/layouts/InteriorLayout';
import { Seo } from '@/components/Seo';
import { zigZagGridConfig, siteConfig } from '@/config';
import { getAllAdventures } from '@/lib/content-registry';
import { pageTitle } from '@/lib/site';
import { breadcrumbJsonLd, travelAgencyJsonLd } from '@/lib/jsonld';

export default function AdventureListingPage() {
  const items = getAllAdventures();
  const desc = `Coastal Kenya adventures — ${zigZagGridConfig.sectionTitle}. ${siteConfig.siteDescription}`;

  return (
    <InteriorLayout>
      <Seo
        title={pageTitle('Adventures')}
        description={desc}
        canonicalPath="/adventures"
        jsonLd={[
          travelAgencyJsonLd(),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Adventures', path: '/adventures' },
          ]),
        ]}
      />
      <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-24 lg:px-12">
        <header className="mb-14 max-w-2xl">
          <p className="font-body text-sm uppercase tracking-[0.2em] text-kaleo-terracotta">
            {zigZagGridConfig.sectionLabel}
          </p>
          <h1 className="mt-3 font-display text-headline text-kaleo-earth">{zigZagGridConfig.sectionTitle}</h1>
          <p className="mt-4 font-body text-body text-kaleo-earth/70">
            Each route has a dedicated page with more detail and links to matching tour packages.
          </p>
        </header>

        <ul className="grid list-none gap-10 md:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <article className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-kaleo-earth/5">
                <Link to={`/adventures/${item.id}`} className="block">
                  <img
                    src={item.image}
                    alt={item.imageAlt}
                    width={800}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/3] w-full object-cover transition-transform duration-500 hover:scale-[1.02]"
                  />
                </Link>
                <div className="p-6 md:p-8">
                  <p className="font-body text-xs uppercase tracking-[0.2em] text-kaleo-terracotta">{item.subtitle}</p>
                  <h2 className="mt-2 font-display text-2xl text-kaleo-earth">{item.title}</h2>
                  <p className="mt-3 font-body text-sm leading-relaxed text-kaleo-earth/75 line-clamp-3">
                    {item.description}
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={`/adventures/${item.id}`}
                      className="inline-flex rounded-full bg-kaleo-terracotta px-6 py-2.5 font-body text-xs uppercase tracking-wider text-white transition-colors hover:bg-kaleo-earth"
                    >
                      Full details
                    </Link>
                    {item.relatedPackageSlug && (
                      <Link
                        to={`/packages/${item.relatedPackageSlug}`}
                        className="inline-flex rounded-full border border-kaleo-earth/20 px-6 py-2.5 font-body text-xs uppercase tracking-wider text-kaleo-earth transition-colors hover:border-kaleo-terracotta"
                      >
                        Matching package
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>

        <nav aria-label="Related" className="mt-16 border-t border-kaleo-earth/10 pt-10">
          <p className="font-body text-sm text-kaleo-earth/60">
            See{' '}
            <Link to="/packages" className="text-kaleo-terracotta underline-offset-4 hover:underline">
              pricing and inclusions
            </Link>{' '}
            or{' '}
            <Link to="/" className="text-kaleo-terracotta underline-offset-4 hover:underline">
              the main site
            </Link>
            .
          </p>
        </nav>
      </div>
    </InteriorLayout>
  );
}
