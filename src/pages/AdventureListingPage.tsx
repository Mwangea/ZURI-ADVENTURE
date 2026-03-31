import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { InteriorLayout } from '@/layouts/InteriorLayout';
import { Seo } from '@/components/Seo';
import { zigZagGridConfig, siteConfig } from '@/config';
import { pageTitle } from '@/lib/site';
import {
  adventureItemListJsonLd,
  breadcrumbJsonLd,
  travelAgencyJsonLd,
} from '@/lib/jsonld';
import {
  fetchPublicAdventures,
  toAbsoluteMediaUrl,
  type PublicAdventureListItem,
  type PublicPageMeta,
} from '@/lib/publicApi';

const ADVENTURE_FILTERS_STORAGE_KEY = 'zuri.public.adventures.filters';

function readInitialAdventureFilters() {
  if (typeof window === 'undefined') return { search: '' };
  try {
    const raw = window.localStorage.getItem(ADVENTURE_FILTERS_STORAGE_KEY);
    if (!raw) return { search: '' };
    const parsed = JSON.parse(raw) as Partial<{ search: string }>;
    return {
      search: typeof parsed.search === 'string' ? parsed.search.slice(0, 80) : '',
    };
  } catch {
    return { search: '' };
  }
}

export default function AdventureListingPage() {
  const pageSize = 12;
  const initialFilters = readInitialAdventureFilters();
  const [items, setItems] = useState<PublicAdventureListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(initialFilters.search);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageMeta, setPageMeta] = useState<PublicPageMeta | null>(null);
  const hasActiveFilters = search.trim().length > 0;
  const totalPages = Math.max(1, Math.ceil((pageMeta?.total ?? 0) / pageSize));

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const resetFilters = () => {
    setSearch('');
    setSearchQuery('');
    setPage(1);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(ADVENTURE_FILTERS_STORAGE_KEY);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      ADVENTURE_FILTERS_STORAGE_KEY,
      JSON.stringify({ search: search.slice(0, 80) }),
    );
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchPublicAdventures({
          q: searchQuery || undefined,
          limit: pageSize,
          offset: (page - 1) * pageSize,
        });
        if (!cancelled) {
          setItems(data.adventures ?? []);
          setPageMeta(data.page ?? null);
        }
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchQuery, page]);
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
          adventureItemListJsonLd(items.map((item) => ({ slug: item.slug, title: item.title }))),
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

        <section className="mb-8 rounded-2xl border border-kaleo-earth/10 bg-white p-4">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search adventures..."
              className="w-full max-w-[320px] rounded-full border border-kaleo-earth/20 px-4 py-2 text-sm outline-none"
            />
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="rounded-full border border-kaleo-earth/20 px-4 py-2 text-sm text-kaleo-earth disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
          </div>
        </section>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="mb-4 text-sm text-kaleo-earth/60">Loading adventures...</p> : null}
        <ul className="grid list-none gap-10 md:grid-cols-2">
          {items.map((item) => (
            <li key={item.id}>
              <article className="overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-kaleo-earth/5">
                <Link to={`/adventures/${item.slug}`} className="block">
                  <img
                    src={toAbsoluteMediaUrl(item.image)}
                    alt={item.title}
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
                    Explore this destination in detail and connect it to matching package options.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      to={`/adventures/${item.slug}`}
                      className="inline-flex rounded-full bg-kaleo-terracotta px-6 py-2.5 font-body text-xs uppercase tracking-wider text-white transition-colors hover:bg-kaleo-earth"
                    >
                      Full details
                    </Link>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
        {!loading && !error && items.length === 0 ? (
          <p className="mt-6 rounded-xl border border-kaleo-earth/10 bg-white px-4 py-3 text-sm text-kaleo-earth/70">
            No adventures found for this search. Try another keyword or reset.
          </p>
        ) : null}
        {!loading && !error && items.length > 0 ? (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-full border border-kaleo-earth/20 px-4 py-2 text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="px-2 text-sm text-kaleo-earth/70">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="rounded-full border border-kaleo-earth/20 px-4 py-2 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        ) : null}

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
