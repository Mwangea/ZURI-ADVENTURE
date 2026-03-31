import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, Users, Car } from 'lucide-react';
import { InteriorLayout } from '@/layouts/InteriorLayout';
import { Seo } from '@/components/Seo';
import { packagesConfig, siteConfig } from '@/config';
import { pageTitle } from '@/lib/site';
import {
  breadcrumbJsonLd,
  packageItemListJsonLd,
  travelAgencyJsonLd,
} from '@/lib/jsonld';
import {
  fetchPublicPackages,
  toAbsoluteMediaUrl,
  type PublicPageMeta,
  type PublicPackageListItem,
  type PublicPackageListParams,
} from '@/lib/publicApi';

const iconMap: Record<string, typeof Star> = {
  star: Star,
  clock: Clock,
  users: Users,
  car: Car,
};

const PACKAGE_FILTERS_STORAGE_KEY = 'zuri.public.packages.filters';

function readInitialPackageFilters() {
  if (typeof window === 'undefined') {
    return { search: '', featuredOnly: false, durationFilter: 'ALL', sort: 'featured' as const };
  }
  try {
    const raw = window.localStorage.getItem(PACKAGE_FILTERS_STORAGE_KEY);
    if (!raw)
      return { search: '', featuredOnly: false, durationFilter: 'ALL', sort: 'featured' as const };
    const parsed = JSON.parse(raw) as Partial<{
      search: string;
      featuredOnly: boolean;
      durationFilter: string;
      sort: PublicPackageListParams['sort'];
    }>;
    const allowedSort = new Set(['featured', 'newest', 'price_asc', 'price_desc', 'name_asc']);
    return {
      search: typeof parsed.search === 'string' ? parsed.search.slice(0, 80) : '',
      featuredOnly: Boolean(parsed.featuredOnly),
      durationFilter: typeof parsed.durationFilter === 'string' ? parsed.durationFilter : 'ALL',
      sort: allowedSort.has(String(parsed.sort))
        ? (parsed.sort as PublicPackageListParams['sort'])
        : ('featured' as const),
    };
  } catch {
    return { search: '', featuredOnly: false, durationFilter: 'ALL', sort: 'featured' as const };
  }
}

export default function PackageListingPage() {
  const pageSize = 12;
  const initialFilters = readInitialPackageFilters();
  const [packages, setPackages] = useState<PublicPackageListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(initialFilters.search);
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(initialFilters.featuredOnly);
  const [durationFilter, setDurationFilter] = useState(initialFilters.durationFilter);
  const [sort, setSort] = useState<PublicPackageListParams['sort']>(initialFilters.sort);
  const [page, setPage] = useState(1);
  const [pageMeta, setPageMeta] = useState<PublicPageMeta | null>(null);
  const hasActiveFilters =
    search.trim().length > 0 || featuredOnly || durationFilter !== 'ALL' || sort !== 'featured';
  const totalPages = Math.max(1, Math.ceil((pageMeta?.total ?? 0) / pageSize));

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchQuery(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(
      PACKAGE_FILTERS_STORAGE_KEY,
      JSON.stringify({
        search: search.slice(0, 80),
        featuredOnly,
        durationFilter,
        sort,
      }),
    );
  }, [search, featuredOnly, durationFilter, sort]);

  const resetFilters = () => {
    setSearch('');
    setSearchQuery('');
    setFeaturedOnly(false);
    setDurationFilter('ALL');
    setSort('featured');
    setPage(1);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(PACKAGE_FILTERS_STORAGE_KEY);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [searchQuery, featuredOnly, durationFilter, sort]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await fetchPublicPackages({
          q: searchQuery || undefined,
          duration: durationFilter === 'ALL' ? undefined : durationFilter,
          featured: featuredOnly || undefined,
          sort: sort ?? 'featured',
          limit: pageSize,
          offset: (page - 1) * pageSize,
        });
        if (!cancelled) {
          setPackages(data.packages ?? []);
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
  }, [searchQuery, durationFilter, featuredOnly, sort, page]);

  const durationOptions = useMemo(() => {
    const set = new Set<string>();
    packages.forEach((p) => {
      if (p.duration) set.add(p.duration);
    });
    return Array.from(set);
  }, [packages]);

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
          packageItemListJsonLd(packages),
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

        <section className="mb-8 rounded-2xl border border-kaleo-earth/10 bg-white p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search packages..."
              className="w-full rounded-full border border-kaleo-earth/20 px-4 py-2 text-sm outline-none sm:col-span-2 lg:col-span-2"
            />
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              title="Filter by duration"
              className="w-full rounded-full border border-kaleo-earth/20 px-4 py-2 text-sm outline-none"
            >
              <option value="ALL">All durations</option>
              {durationOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-2 rounded-full border border-kaleo-earth/20 px-4 py-2 text-sm text-kaleo-earth/70">
              <input type="checkbox" checked={featuredOnly} onChange={(e) => setFeaturedOnly(e.target.checked)} />
              Featured only
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as PublicPackageListParams['sort'])}
              title="Sort packages"
              className="w-full rounded-full border border-kaleo-earth/20 px-4 py-2 text-sm outline-none"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
              <option value="name_asc">Name A-Z</option>
            </select>
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="w-full rounded-full border border-kaleo-earth/20 px-4 py-2 text-sm text-kaleo-earth disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset
            </button>
          </div>
          <div className="mt-3 text-xs text-kaleo-earth/50">Total: {pageMeta?.total ?? packages.length}</div>
        </section>

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
        {loading ? <p className="mb-4 text-sm text-kaleo-earth/60">Loading packages...</p> : null}

        <ul className="grid list-none grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {packages.map((pkg) => {
            const Icon = iconMap[pkg.duration?.toLowerCase().includes('half') ? 'clock' : 'star'] || Star;
            return (
              <li key={pkg.slug}>
                <article className="flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-kaleo-earth/5">
                  <Link to={`/packages/${pkg.slug}`} className="relative block h-48 overflow-hidden">
                    <img
                      src={toAbsoluteMediaUrl(pkg.image)}
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
                      {`${pkg.name} — ${pkg.duration} adventure on the Kenya coast.`}
                    </p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="font-display text-2xl text-kaleo-earth">{pkg.price}</span>
                      <span className="font-body text-sm text-kaleo-earth/60">{pkg.priceNote}</span>
                    </div>
                    {pkg.featured ? (
                      <span className="mt-3 inline-flex w-fit rounded-full bg-kaleo-sand px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-kaleo-earth">
                        Featured
                      </span>
                    ) : null}
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
        {!loading && !error && packages.length === 0 ? (
          <p className="mt-6 rounded-xl border border-kaleo-earth/10 bg-white px-4 py-3 text-sm text-kaleo-earth/70">
            No packages found for the current filters. Try resetting or changing your search.
          </p>
        ) : null}
        {!loading && !error && packages.length > 0 ? (
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
