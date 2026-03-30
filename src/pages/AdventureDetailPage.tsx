import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { InteriorLayout } from '@/layouts/InteriorLayout';
import { Seo } from '@/components/Seo';
import { getAdventureBySlug, getPackageBySlug } from '@/lib/content-registry';
import { pageTitle } from '@/lib/site';
import { breadcrumbJsonLd, touristTripJsonLd, travelAgencyJsonLd } from '@/lib/jsonld';

export default function AdventureDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const item = slug ? getAdventureBySlug(slug) : undefined;

  if (!item) {
    return <Navigate to="/404" replace />;
  }

  const path = `/adventures/${item.id}`;
  const relatedPkg = item.relatedPackageSlug ? getPackageBySlug(item.relatedPackageSlug) : undefined;
  const description = item.seoDescription ?? item.description;
  const title = pageTitle(item.title);

  return (
    <InteriorLayout>
      <Seo
        title={title}
        description={description}
        canonicalPath={path}
        ogImage={item.image}
        ogImageAlt={item.imageAlt}
        ogType="article"
        jsonLd={[
          travelAgencyJsonLd(),
          touristTripJsonLd(item, path),
          breadcrumbJsonLd([
            { name: 'Home', path: '/' },
            { name: 'Adventures', path: '/adventures' },
            { name: item.title, path },
          ]),
        ]}
      />
      <article className="mx-auto max-w-4xl px-6 py-12 md:px-8 md:py-16 lg:px-12">
        <nav aria-label="Breadcrumb" className="mb-8">
          <Link
            to="/adventures"
            className="inline-flex items-center gap-2 font-body text-sm text-kaleo-earth/70 transition-colors hover:text-kaleo-terracotta"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All adventures
          </Link>
        </nav>

        <div className="overflow-hidden rounded-3xl">
          <img
            src={item.image}
            alt={item.imageAlt}
            width={1200}
            height={675}
            className="aspect-[16/9] w-full object-cover"
            fetchPriority="high"
          />
        </div>

        <header className="mt-10">
          <p className="font-body text-sm uppercase tracking-[0.2em] text-kaleo-terracotta">{item.subtitle}</p>
          <h1 className="mt-2 font-display text-headline text-kaleo-earth">{item.title}</h1>
        </header>

        <p className="mt-8 font-body text-lg leading-relaxed text-kaleo-earth/80">{item.description}</p>

        <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:flex-wrap">
          {relatedPkg && (
            <Link
              to={`/packages/${relatedPkg.slug}`}
              className="inline-flex items-center justify-center rounded-full bg-kaleo-terracotta px-8 py-4 font-body text-sm uppercase tracking-wider text-white transition-colors hover:bg-kaleo-earth"
            >
              View {relatedPkg.name} package
            </Link>
          )}
          <Link
            to="/packages"
            className="inline-flex items-center justify-center rounded-full border border-kaleo-earth/20 px-8 py-4 font-body text-sm uppercase tracking-wider text-kaleo-earth transition-colors hover:border-kaleo-terracotta"
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
