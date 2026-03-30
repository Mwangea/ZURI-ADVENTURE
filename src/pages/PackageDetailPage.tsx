import { Link, Navigate, useParams } from 'react-router-dom';
import { Check, ArrowLeft } from 'lucide-react';
import { InteriorLayout } from '@/layouts/InteriorLayout';
import { Seo } from '@/components/Seo';
import { useBookingModal } from '@/components/BookingModalProvider';
import { getPackageBySlug, getAdventureForPackage } from '@/lib/content-registry';
import { pageTitle } from '@/lib/site';
import { breadcrumbJsonLd, packageProductJsonLd, travelAgencyJsonLd } from '@/lib/jsonld';

export default function PackageDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { openBooking } = useBookingModal();
  const pkg = slug ? getPackageBySlug(slug) : undefined;

  if (!pkg) {
    return <Navigate to="/404" replace />;
  }

  const path = `/packages/${pkg.slug}`;
  const adventure = getAdventureForPackage(pkg.slug);
  const title = pageTitle(pkg.name);
  const description =
    pkg.seoDescription ?? `${pkg.name} — ${pkg.duration} coastal Kenya tour with Zuri Adventures.`;

  const jsonLd = [
    travelAgencyJsonLd(),
    packageProductJsonLd(pkg, path),
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Packages', path: '/packages' },
      { name: pkg.name, path },
    ]),
  ];

  return (
    <InteriorLayout>
      <Seo
        title={title}
        description={description}
        canonicalPath={path}
        ogImage={pkg.image}
        ogImageAlt={`${pkg.name} — Kenya coast tour`}
        ogType="article"
        jsonLd={jsonLd}
      />
      <article className="mx-auto max-w-4xl px-6 py-12 md:px-8 md:py-16 lg:px-12">
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link
            to="/packages"
            className="inline-flex items-center gap-2 font-body text-sm text-kaleo-earth/70 transition-colors hover:text-kaleo-terracotta"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All packages
          </Link>
        </nav>

        <div className="overflow-hidden rounded-3xl">
          <img
            src={pkg.image}
            alt={`${pkg.name} tour in coastal Kenya`}
            width={1200}
            height={675}
            className="aspect-[16/9] w-full object-cover"
            fetchPriority="high"
          />
        </div>

        <header className="mt-10">
          <p className="font-body text-sm uppercase tracking-[0.2em] text-kaleo-terracotta">{pkg.duration}</p>
          <h1 className="mt-2 font-display text-headline text-kaleo-earth">{pkg.name}</h1>
          <p className="mt-4 font-body text-lg text-kaleo-earth/75">{description}</p>
          <div className="mt-6 flex flex-wrap items-baseline gap-2">
            <span className="font-display text-4xl text-kaleo-earth">{pkg.price}</span>
            <span className="font-body text-kaleo-earth/60">{pkg.priceNote}</span>
          </div>
        </header>

        <section className="mt-10" aria-labelledby="includes-heading">
          <h2 id="includes-heading" className="font-display text-xl text-kaleo-earth">
            What&apos;s included
          </h2>
          <ul className="mt-4 space-y-3">
            {pkg.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-kaleo-terracotta" aria-hidden />
                <span className="font-body text-kaleo-earth/80">{feature}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => openBooking({ packageName: pkg.name })}
            className="rounded-full bg-kaleo-terracotta px-8 py-4 font-body text-sm uppercase tracking-wider text-white transition-colors hover:bg-kaleo-earth"
          >
            {pkg.ctaText}
          </button>
          {adventure && (
            <Link
              to={`/adventures/${adventure.id}`}
              className="inline-flex items-center justify-center rounded-full border border-kaleo-earth/20 px-8 py-4 font-body text-sm uppercase tracking-wider text-kaleo-earth transition-colors hover:border-kaleo-terracotta hover:text-kaleo-terracotta"
            >
              Read adventure overview
            </Link>
          )}
        </div>

        <nav aria-label="Related destinations" className="mt-14 border-t border-kaleo-earth/10 pt-10">
          <p className="font-body text-sm text-kaleo-earth/70">
            More trips:{' '}
            <Link to="/packages" className="text-kaleo-terracotta underline-offset-4 hover:underline">
              all packages
            </Link>
            {' · '}
            <Link to="/adventures" className="text-kaleo-terracotta underline-offset-4 hover:underline">
              adventures by place
            </Link>
            {' · '}
            <Link to="/" className="text-kaleo-terracotta underline-offset-4 hover:underline">
              homepage
            </Link>
          </p>
        </nav>
      </article>
    </InteriorLayout>
  );
}
