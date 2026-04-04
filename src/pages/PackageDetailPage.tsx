import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Check, ArrowLeft, Star } from 'lucide-react';
import { InteriorLayout } from '@/layouts/InteriorLayout';
import { Seo } from '@/components/Seo';
import { useBookingModal } from '@/components/BookingModalProvider';
import { pageTitle } from '@/lib/site';
import { breadcrumbJsonLd, packageProductJsonLd, travelAgencyJsonLd } from '@/lib/jsonld';
import {
  fetchPublicPackageDetail,
  toAbsoluteMediaUrl,
  toEmbeddedVideoUrl,
  type PublicPackageDetail,
} from '@/lib/publicApi';
import { TripShareBar } from '@/components/TripShareBar';

export default function PackageDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { openBooking } = useBookingModal();
  const [pkg, setPkg] = useState<PublicPackageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        setNotFound(false);
        const data = await fetchPublicPackageDetail(slug);
        if (!cancelled) {
          setPkg(data.package ?? null);
          setActiveMediaIndex(0);
        }
      } catch (err) {
        if (cancelled) return;
        const status = (err as { status?: number }).status;
        if (status === 404) {
          setNotFound(true);
        } else {
          setError((err as Error).message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (notFound) {
    return <Navigate to="/404" replace />;
  }
  if (!pkg && !loading && !error) return <Navigate to="/404" replace />;

  const mediaItems = pkg?.media?.length ? pkg.media : [];
  const thumbItems = pkg?.thumbnails?.length ? pkg.thumbnails : mediaItems;
  const activeMedia = mediaItems[activeMediaIndex] ?? null;
  const relatedPackages = pkg?.relatedPackages ?? [];
  const embeddedVideos = mediaItems
    .filter((m) => m.type === 'VIDEO')
    .map((m) => ({ ...m, embedUrl: toEmbeddedVideoUrl(m.videoEmbedUrl || m.srcUrl || '') }))
    .filter((m) => m.embedUrl);

  const path = `/packages/${pkg?.slug ?? slug ?? ''}`;
  const title = pageTitle(pkg?.name ?? 'Package');
  const description =
    pkg?.seoDescription ?? `${pkg?.name ?? 'Package'} — ${pkg?.duration ?? ''} coastal Kenya tour with Zuri Adventures.`;

  const jsonLd = [
    travelAgencyJsonLd(),
    pkg
      ? packageProductJsonLd(
          {
            slug: pkg.slug,
            name: pkg.name,
            duration: pkg.duration,
            price: pkg.priceFrom,
            priceNote: pkg.priceNote,
            image: toAbsoluteMediaUrl(pkg.heroImage),
            features: pkg.included,
            ctaText: 'Book now',
            ctaLink: '#book',
            featured: pkg.featured,
            icon: 'star',
            seoDescription: pkg.seoDescription,
          },
          path,
        )
      : {},
    breadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Packages', path: '/packages' },
      { name: pkg?.name ?? 'Package', path },
    ]),
  ];

  return (
    <InteriorLayout>
      <Seo
        title={title}
        description={description}
        canonicalPath={path}
        ogImage={toAbsoluteMediaUrl(pkg?.heroImage)}
        ogImageAlt={`${pkg?.name ?? 'Package'} — Kenya coast tour`}
        ogType="article"
        jsonLd={jsonLd}
      />
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:px-8 md:py-16 lg:px-12">
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link
            to="/packages"
            className="inline-flex items-center gap-2 font-body text-sm text-kaleo-earth/70 transition-colors hover:text-kaleo-terracotta"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All packages
          </Link>
        </nav>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="mb-4 text-sm text-kaleo-earth/60">Loading package...</p> : null}

        {activeMedia ? (
          <div className="overflow-hidden rounded-3xl">
            {activeMedia.type === 'VIDEO' && toEmbeddedVideoUrl(activeMedia.videoEmbedUrl || activeMedia.srcUrl || '') ? (
              <iframe
                src={toEmbeddedVideoUrl(activeMedia.videoEmbedUrl || activeMedia.srcUrl || '')}
                title={`${pkg?.name ?? 'Package'} video`}
                className="aspect-[16/9] w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : activeMedia.type === 'VIDEO' ? (
              <video
                src={toAbsoluteMediaUrl(activeMedia.srcUrl)}
                className="aspect-[16/9] w-full object-cover"
                controls
                playsInline
              />
            ) : (
              <img
                src={toAbsoluteMediaUrl(activeMedia.srcUrl)}
                alt={`${pkg?.name ?? 'Package'} tour in coastal Kenya`}
                width={1200}
                height={675}
                className="aspect-[16/9] w-full object-cover"
                fetchPriority="high"
              />
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-3xl">
            <img
              src={toAbsoluteMediaUrl(pkg?.heroImage)}
              alt={`${pkg?.name ?? 'Package'} tour in coastal Kenya`}
              width={1200}
              height={675}
              className="aspect-[16/9] w-full object-cover"
              fetchPriority="high"
            />
          </div>
        )}

        {thumbItems.length > 0 ? (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3">
            {thumbItems.map((m, idx) => (
              <button
                key={`${m.id}-${idx}`}
                type="button"
                onClick={() => {
                  const selectedIndex = mediaItems.findIndex((mm) => mm.id === m.id);
                  setActiveMediaIndex(selectedIndex >= 0 ? selectedIndex : 0);
                }}
                className="overflow-hidden rounded-xl border border-kaleo-earth/10"
              >
                <img
                  src={toAbsoluteMediaUrl(m.thumbnailUrl || m.srcUrl)}
                  alt={m.title || `${pkg?.name ?? 'Package'} media`}
                  className="h-16 w-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : null}

        <header className="mt-10">
          <p className="font-body text-sm uppercase tracking-[0.2em] text-kaleo-terracotta">{pkg?.duration}</p>
          <h1 className="mt-2 font-display text-headline text-kaleo-earth">{pkg?.name}</h1>
          <p className="mt-4 font-body text-lg text-kaleo-earth/75">{description}</p>
          <div className="mt-6 flex flex-wrap items-baseline gap-2">
            <span className="font-display text-4xl text-kaleo-earth">{pkg?.priceFrom}</span>
            <span className="font-body text-kaleo-earth/60">{pkg?.priceNote}</span>
          </div>
        </header>

        {pkg ? <TripShareBar path={path} title={pkg.name} /> : null}

        <section className="mt-10 grid gap-4 rounded-2xl border border-kaleo-earth/10 bg-white p-5 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="text-xs uppercase text-kaleo-earth/50">Tour type</p>
            <p className="mt-1 font-semibold text-kaleo-earth">{pkg?.tourType || '-'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-kaleo-earth/50">Duration</p>
            <p className="mt-1 font-semibold text-kaleo-earth">{pkg?.duration || '-'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-kaleo-earth/50">Max people</p>
            <p className="mt-1 font-semibold text-kaleo-earth">{pkg?.maxPeople ?? '-'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-kaleo-earth/50">Min age</p>
            <p className="mt-1 font-semibold text-kaleo-earth">{pkg?.minAge ?? '-'}</p>
          </div>
        </section>

        {pkg?.overview ? (
          <section className="mt-10">
            <h2 className="font-display text-xl text-kaleo-earth">Overview</h2>
            <p className="mt-3 whitespace-pre-line font-body text-kaleo-earth/80">{pkg.overview}</p>
          </section>
        ) : null}

        {pkg?.tourHighlights?.length ? (
          <section className="mt-10">
            <h2 className="font-display text-xl text-kaleo-earth">Tour highlights</h2>
            <ul className="mt-4 space-y-3">
              {pkg.tourHighlights.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-kaleo-terracotta" aria-hidden />
                  <span className="font-body text-kaleo-earth/80">{feature}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-10 grid gap-6 sm:grid-cols-2">
          <div>
            <h2 id="includes-heading" className="font-display text-xl text-kaleo-earth">
              Included
            </h2>
            <ul className="mt-4 space-y-3">
              {(pkg?.included ?? []).map((item) => (
                <li key={`inc-${item}`} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-kaleo-terracotta" aria-hidden />
                  <span className="font-body text-kaleo-earth/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-display text-xl text-kaleo-earth">Excluded</h2>
            <ul className="mt-4 space-y-3">
              {(pkg?.excluded ?? []).map((item) => (
                <li key={`exc-${item}`} className="flex items-start gap-2">
                  <span className="mt-0.5 h-4 w-4 flex-shrink-0 text-center text-kaleo-terracotta">-</span>
                  <span className="font-body text-kaleo-earth/80">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {pkg?.priceTiers?.length ? (
          <section className="mt-10">
            <h2 className="font-display text-xl text-kaleo-earth">Tour prices</h2>
            <div className="mt-4 overflow-x-auto rounded-xl border border-kaleo-earth/10">
              <table className="min-w-[380px] w-full border-collapse text-sm">
                <thead className="bg-kaleo-sand/40">
                  <tr>
                    <th className="px-3 py-2 text-left">Persons</th>
                    <th className="px-3 py-2 text-left">Price per person</th>
                  </tr>
                </thead>
                <tbody>
                  {pkg.priceTiers.map((t, idx) => (
                    <tr key={`${t.minPerson}-${t.maxPerson}-${idx}`} className="border-t border-kaleo-earth/10">
                      <td className="px-3 py-2">{t.minPerson} - {t.maxPerson}</td>
                      <td className="px-3 py-2">{t.pricePerPerson}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {embeddedVideos.length ? (
          <section className="mt-10">
            <h2 className="font-display text-xl text-kaleo-earth">Videos</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {embeddedVideos.map((v) => (
                <iframe
                  key={`video-${v.id}`}
                  src={v.embedUrl}
                  title={v.title || `${pkg?.name ?? 'Package'} video`}
                  className="aspect-video w-full rounded-xl border border-kaleo-earth/10"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                />
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            type="button"
            onClick={() => openBooking({ packageName: pkg?.name ?? 'Package' })}
            className="w-full rounded-full bg-kaleo-terracotta px-6 py-3.5 font-body text-sm uppercase tracking-wider text-white transition-colors hover:bg-kaleo-earth sm:w-auto"
          >
            Book now
          </button>
          <Link
            to="/adventures"
            className="inline-flex w-full items-center justify-center rounded-full border border-kaleo-earth/20 px-6 py-3.5 font-body text-sm uppercase tracking-wider text-kaleo-earth transition-colors hover:border-kaleo-terracotta hover:text-kaleo-terracotta sm:w-auto"
          >
            Explore adventures
          </Link>
        </div>

        {relatedPackages.length ? (
          <section className="mt-10">
            <h2 className="font-display text-xl text-kaleo-earth">You may like</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {relatedPackages.map((r) => (
                <Link key={r.slug} to={`/packages/${r.slug}`} className="overflow-hidden rounded-2xl border border-kaleo-earth/10 bg-white">
                  <img src={toAbsoluteMediaUrl(r.image)} alt={r.name} className="h-32 w-full object-cover" />
                  <p className="px-4 py-3 font-semibold text-kaleo-earth">{r.name}</p>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10 rounded-2xl border border-kaleo-earth/10 bg-white p-6" aria-labelledby="package-reviews-heading">
          <h2 id="package-reviews-heading" className="font-display text-xl text-kaleo-earth">
            Reviews
          </h2>
          <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-dashed border-kaleo-earth/20 bg-kaleo-sand/25 px-6 py-12 text-center">
            <Star className="h-11 w-11 text-kaleo-earth/20" strokeWidth={1.25} aria-hidden />
            <p className="mt-4 font-body text-sm font-medium text-kaleo-earth/70">No reviews yet</p>
            <p className="mt-2 max-w-sm font-body text-xs leading-relaxed text-kaleo-earth/50">
              Guest reviews will appear here after trips. Book with us and you can share your experience later.
            </p>
          </div>
        </section>

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
