import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { InteriorLayout } from '@/layouts/InteriorLayout';
import { Seo } from '@/components/Seo';
import { pageTitle } from '@/lib/site';
import { breadcrumbJsonLd, touristTripJsonLd, travelAgencyJsonLd } from '@/lib/jsonld';
import { fetchPublicAdventureDetail, toAbsoluteMediaUrl, type PublicAdventureDetail } from '@/lib/publicApi';

export default function AdventureDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<PublicAdventureDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        setNotFound(false);
        const data = await fetchPublicAdventureDetail(slug);
        if (!cancelled) setItem(data.adventure ?? null);
      } catch (err) {
        if (cancelled) return;
        const status = (err as { status?: number }).status;
        if (status === 404) setNotFound(true);
        else setError((err as Error).message);
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
  if (!item && !loading && !error) return <Navigate to="/404" replace />;

  const path = `/adventures/${item?.slug ?? slug ?? ''}`;
  const relatedPkg = item?.relatedPackage ?? null;
  const description = item?.description ?? '';
  const title = pageTitle(item?.title ?? 'Adventure');

  return (
    <InteriorLayout>
      <Seo
        title={title}
        description={description}
        canonicalPath={path}
        ogImage={toAbsoluteMediaUrl(item?.image)}
        ogImageAlt={item?.title ?? 'Adventure'}
        ogType="article"
        jsonLd={[
          travelAgencyJsonLd(),
          touristTripJsonLd(
            {
              title: item?.title ?? '',
              description: item?.description ?? '',
              image: toAbsoluteMediaUrl(item?.image),
            },
            path,
          ),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Adventures', path: '/adventures' },
            { name: item?.title ?? 'Adventure', path },
          ]),
        ]}
      />
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6 md:px-8 md:py-16 lg:px-12">
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link
            to="/adventures"
            className="inline-flex items-center gap-2 font-body text-sm text-kaleo-earth/70 transition-colors hover:text-kaleo-terracotta"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All adventures
          </Link>
        </nav>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="mb-4 text-sm text-kaleo-earth/60">Loading adventure...</p> : null}
        {item ? (
          <div className="overflow-hidden rounded-3xl">
            <img
              src={toAbsoluteMediaUrl(item.image)}
              alt={item.title}
              width={1200}
              height={675}
              className="aspect-[16/9] w-full object-cover"
              fetchPriority="high"
            />
          </div>
        ) : null}

        <header className="mt-10">
          <p className="font-body text-sm uppercase tracking-[0.2em] text-kaleo-terracotta">{item?.subtitle}</p>
          <h1 className="mt-2 font-display text-headline text-kaleo-earth">{item?.title}</h1>
        </header>

        <p className="mt-8 font-body text-lg leading-relaxed text-kaleo-earth/80">{item?.description}</p>

        <div className="mt-12 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {relatedPkg ? (
            <Link
              to={`/packages/${relatedPkg.slug}`}
              className="inline-flex w-full items-center justify-center rounded-full bg-kaleo-terracotta px-6 py-3.5 font-body text-sm uppercase tracking-wider text-white transition-colors hover:bg-kaleo-earth sm:w-auto"
            >
              View {relatedPkg.name} package
            </Link>
          ) : null}
          <Link
            to="/packages"
            className="inline-flex w-full items-center justify-center rounded-full border border-kaleo-earth/20 px-6 py-3.5 font-body text-sm uppercase tracking-wider text-kaleo-earth transition-colors hover:border-kaleo-terracotta sm:w-auto"
          >
            Compare all packages
          </Link>
        </div>

        <nav aria-label="Related" className="mt-14 border-t border-kaleo-earth/10 pt-10">
          <p className="font-body text-sm text-kaleo-earth/70">
            <Link to="/adventures" className="text-kaleo-terracotta underline-offset-4 hover:underline">
              More adventures
            </Link>
            {' · '}
            <Link to="/" className="text-kaleo-terracotta underline-offset-4 hover:underline">
              Home
            </Link>
          </p>
        </nav>
      </article>
    </InteriorLayout>
  );
}
