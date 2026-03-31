import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useAdminAuth } from '@/auth/AdminAuthContext';

const DASHBOARD_FILTERS_KEY = 'zuri.admin.dashboard.filters';
const DASHBOARD_CACHE_PREFIX = 'zuri.admin.dashboard.cache:';
const DASHBOARD_CACHE_TTL_MS = 5 * 60 * 1000;

type DashboardSummary = {
  cards: {
    packagesTotal: number;
    adventuresTotal: number;
    packagesPublished: number;
    adventuresPublished: number;
    confirmedEnquiriesTotal: number;
    customersTotal: number;
  };
  bookingOverview: Array<{
    monthLabel: string;
    total: number;
  }>;
  revenueTrend: Array<{
    monthLabel: string;
    total: number;
  }>;
  recentEnquiries: Array<{
    id: number;
    customerName: string;
    status: 'NEW' | 'IN_REVIEW' | 'CONFIRMED' | 'CANCELLED';
    createdAt: string;
  }>;
  filters?: {
    rangeMonths: number;
    status: 'ALL' | 'NEW' | 'IN_REVIEW' | 'CONFIRMED' | 'CANCELLED';
    search: string;
    limit: number;
  };
};

type DashboardFilters = {
  status: 'ALL' | 'NEW' | 'IN_REVIEW' | 'CONFIRMED' | 'CANCELLED';
  rangeMonths: number;
  searchInput: string;
};

function readInitialFilters(): DashboardFilters {
  if (typeof window === 'undefined') {
    return { status: 'ALL', rangeMonths: 6, searchInput: '' };
  }

  try {
    const raw = window.localStorage.getItem(DASHBOARD_FILTERS_KEY);
    if (!raw) return { status: 'ALL', rangeMonths: 6, searchInput: '' };
    const parsed = JSON.parse(raw) as Partial<DashboardFilters>;
    const allowedStatuses = new Set(['ALL', 'NEW', 'IN_REVIEW', 'CONFIRMED', 'CANCELLED']);
    const status = allowedStatuses.has(String(parsed.status))
      ? (parsed.status as DashboardFilters['status'])
      : 'ALL';
    const rangeMonths = [3, 6, 12].includes(Number(parsed.rangeMonths)) ? Number(parsed.rangeMonths) : 6;
    const searchInput = typeof parsed.searchInput === 'string' ? parsed.searchInput.slice(0, 80) : '';
    return { status, rangeMonths, searchInput };
  } catch {
    return { status: 'ALL', rangeMonths: 6, searchInput: '' };
  }
}

function isDashboardSummary(value: unknown): value is DashboardSummary {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as DashboardSummary;
  return Boolean(candidate.cards && Array.isArray(candidate.bookingOverview) && Array.isArray(candidate.revenueTrend));
}

export default function AdminDashboardPage() {
  const { authFetch } = useAdminAuth();
  const initial = readInitialFilters();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'NEW' | 'IN_REVIEW' | 'CONFIRMED' | 'CANCELLED'>(initial.status);
  const [rangeMonths, setRangeMonths] = useState(initial.rangeMonths);
  const [searchInput, setSearchInput] = useState(initial.searchInput);
  const [searchValue, setSearchValue] = useState('');
  const totalTours = (summary?.cards.packagesTotal ?? 0) + (summary?.cards.adventuresTotal ?? 0);
  const bookingOverview = summary?.bookingOverview ?? [];
  const revenueTrend = summary?.revenueTrend ?? [];

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchValue(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const payload: DashboardFilters = {
      status: statusFilter,
      rangeMonths,
      searchInput: searchInput.slice(0, 80),
    };
    window.localStorage.setItem(DASHBOARD_FILTERS_KEY, JSON.stringify(payload));
  }, [statusFilter, rangeMonths, searchInput]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams({
        rangeMonths: String(rangeMonths),
        status: statusFilter,
        limit: '12',
      });
      if (searchValue) params.set('search', searchValue);
      const queryString = params.toString();
      const cacheKey = `${DASHBOARD_CACHE_PREFIX}${queryString}`;

      if (typeof window !== 'undefined') {
        try {
          const cachedRaw = window.localStorage.getItem(cacheKey);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw) as { ts?: number; data?: unknown };
            const isFresh = typeof cached.ts === 'number' && Date.now() - cached.ts < DASHBOARD_CACHE_TTL_MS;
            if (isFresh && isDashboardSummary(cached.data) && !cancelled) {
              setSummary(cached.data);
            }
          }
        } catch {
          // ignore malformed cache
        }
      }

      try {
        setLoading(true);
        setError('');
        const data = await authFetch<DashboardSummary>(`/api/v1/admin/dashboard/summary?${queryString}`);
        if (!cancelled) setSummary(data);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
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
  }, [authFetch, rangeMonths, statusFilter, searchValue]);

  const statusTotals = useMemo(() => {
    const source = summary?.recentEnquiries ?? [];
    return source.reduce(
      (acc, item) => {
        acc[item.status] += 1;
        return acc;
      },
      { NEW: 0, IN_REVIEW: 0, CONFIRMED: 0, CANCELLED: 0 } as Record<
        'NEW' | 'IN_REVIEW' | 'CONFIRMED' | 'CANCELLED',
        number
      >,
    );
  }, [summary?.recentEnquiries]);

  const currency = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }),
    [],
  );

  const statusBadgeClass = (status: DashboardSummary['recentEnquiries'][number]['status']) => {
    if (status === 'CONFIRMED') return 'bg-emerald-100 text-emerald-700';
    if (status === 'IN_REVIEW') return 'bg-amber-100 text-amber-700';
    if (status === 'CANCELLED') return 'bg-red-100 text-red-700';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="flex flex-col gap-[22px]">
      {error ? <p className="font-body text-sm text-red-600">{error}</p> : null}

      <section className="grid grid-cols-1 gap-[14px] xl:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <article className="rounded-[14px] bg-kaleo-earth p-5 text-kaleo-cream">
          <p className="text-[12px] font-medium tracking-[.2px] text-kaleo-cream/70">Total tours</p>
          <p className="mt-2 font-display text-[34px] leading-none">{loading ? '...' : totalTours}</p>
        </article>
        <article className="rounded-[14px] border border-kaleo-earth/10 bg-white p-5">
          <p className="text-[12px] font-medium tracking-[.2px] text-kaleo-earth/50">Active tours</p>
          <p className="mt-2 font-display text-[34px] leading-none text-kaleo-earth">
            {loading ? '...' : (summary?.cards.packagesPublished ?? 0) + (summary?.cards.adventuresPublished ?? 0)}
          </p>
        </article>
        <article className="rounded-[14px] border border-kaleo-earth/10 bg-white p-5">
          <p className="text-[12px] font-medium tracking-[.2px] text-kaleo-earth/50">Confirmed bookings</p>
          <p className="mt-2 font-display text-[34px] leading-none text-kaleo-earth">
            {loading ? '...' : summary?.cards.confirmedEnquiriesTotal ?? 0}
          </p>
        </article>
        <article className="rounded-[14px] border border-kaleo-earth/10 bg-white p-5">
          <p className="text-[12px] font-medium tracking-[.2px] text-kaleo-earth/50">Active Customers</p>
          <p className="mt-2 font-display text-[34px] leading-none text-kaleo-earth">
            {loading ? '...' : summary?.cards.customersTotal ?? 0}
          </p>
        </article>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-kaleo-earth/10 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusFilter === 'ALL'
                ? 'bg-kaleo-earth text-white'
                : 'border border-kaleo-earth/15 bg-white text-kaleo-earth'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('NEW')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusFilter === 'NEW'
                ? 'bg-kaleo-earth text-white'
                : 'border border-kaleo-earth/15 bg-white text-kaleo-earth'
            }`}
          >
            New
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('IN_REVIEW')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusFilter === 'IN_REVIEW'
                ? 'bg-kaleo-earth text-white'
                : 'border border-kaleo-earth/15 bg-white text-kaleo-earth'
            }`}
          >
            In review
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CONFIRMED')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusFilter === 'CONFIRMED'
                ? 'bg-kaleo-earth text-white'
                : 'border border-kaleo-earth/15 bg-white text-kaleo-earth'
            }`}
          >
            Confirmed
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('CANCELLED')}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusFilter === 'CANCELLED'
                ? 'bg-kaleo-earth text-white'
                : 'border border-kaleo-earth/15 bg-white text-kaleo-earth'
            }`}
          >
            Cancelled
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold text-kaleo-earth/60" htmlFor="dashboard-range">
            Range
          </label>
          <select
            id="dashboard-range"
            title="Select date range"
            value={rangeMonths}
            onChange={(e) => setRangeMonths(Number(e.target.value))}
            className="rounded-full border border-kaleo-earth/15 bg-white px-3 py-1.5 text-xs font-semibold text-kaleo-earth outline-none"
          >
            <option value={3}>Last 3 months</option>
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
          </select>

          <div className="relative">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-kaleo-earth/45" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search customer/email/phone"
              className="w-[220px] rounded-full border border-kaleo-earth/15 bg-white py-1.5 pl-8 pr-3 text-xs text-kaleo-earth outline-none placeholder:text-kaleo-earth/45"
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <article className="rounded-[14px] border border-kaleo-earth/10 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-[19px] font-bold text-kaleo-earth">Bookings overview</h3>
            <p className="text-xs text-kaleo-earth/50">Last {rangeMonths} months</p>
          </div>
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bookingOverview}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef" />
                <XAxis dataKey="monthLabel" tick={{ fill: '#7f849a', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: '#7f849a', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f6f7fb' }} />
                <Bar dataKey="total" fill="#cf7a59" radius={[7, 7, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="rounded-[14px] border border-kaleo-earth/10 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-[19px] font-bold text-kaleo-earth">Revenue trend</h3>
            <p className="text-xs text-kaleo-earth/50">Estimated from confirmed bookings</p>
          </div>
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e6e8ef" />
                <XAxis dataKey="monthLabel" tick={{ fill: '#7f849a', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#7f849a', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => currency.format(Number(value) || 0)} />
                <Line type="monotone" dataKey="total" stroke="#8f4a31" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>
      </section>

      <section className="overflow-hidden rounded-[14px] border border-kaleo-earth/10 bg-white">
        <div className="grid grid-cols-[110px_1fr_150px_130px] border-b border-kaleo-earth/10 px-5 py-[10px] text-[11px] font-semibold uppercase tracking-[.5px] text-kaleo-earth/50">
          <span>Booking ID</span>
          <span>Customer</span>
          <span>Status</span>
          <span>Date</span>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-sm text-kaleo-earth/55">Loading bookings...</div>
        ) : (summary?.recentEnquiries ?? []).length === 0 ? (
          <div className="px-5 py-8 text-sm text-kaleo-earth/55">No recent bookings yet.</div>
        ) : (
          (summary?.recentEnquiries ?? []).map((row) => {
            const created = new Date(row.createdAt);
            const bookingDate = Number.isNaN(created.getTime())
              ? '-'
              : created.toLocaleDateString(undefined, {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });

            return (
              <div
                key={row.id}
                className="grid h-[62px] grid-cols-[110px_1fr_150px_130px] items-center border-b border-kaleo-earth/10 px-5 text-sm hover:bg-kaleo-sand/30"
              >
                <div className="font-semibold text-kaleo-earth">#{row.id}</div>
                <div className="truncate pr-2 font-medium text-kaleo-earth">{row.customerName || 'Guest'}</div>
                <div>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadgeClass(row.status)}`}>
                    {row.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-kaleo-earth/65">{bookingDate}</div>
              </div>
            );
          })
        )}
      </section>

      <section className="grid grid-cols-2 gap-[14px] xl:grid-cols-4">
        <article className="rounded-[14px] border border-kaleo-earth/10 bg-white p-4">
          <p className="text-[11px] uppercase tracking-[.5px] text-kaleo-earth/45">New</p>
          <p className="mt-1 font-display text-2xl text-kaleo-earth">{statusTotals.NEW}</p>
        </article>
        <article className="rounded-[14px] border border-kaleo-earth/10 bg-white p-4">
          <p className="text-[11px] uppercase tracking-[.5px] text-kaleo-earth/45">In review</p>
          <p className="mt-1 font-display text-2xl text-kaleo-earth">{statusTotals.IN_REVIEW}</p>
        </article>
        <article className="rounded-[14px] border border-kaleo-earth/10 bg-white p-4">
          <p className="text-[11px] uppercase tracking-[.5px] text-kaleo-earth/45">Confirmed</p>
          <p className="mt-1 font-display text-2xl text-kaleo-earth">{statusTotals.CONFIRMED}</p>
        </article>
        <article className="rounded-[14px] border border-kaleo-earth/10 bg-white p-4">
          <p className="text-[11px] uppercase tracking-[.5px] text-kaleo-earth/45">Cancelled</p>
          <p className="mt-1 font-display text-2xl text-kaleo-earth">{statusTotals.CANCELLED}</p>
        </article>
      </section>

      <section className="flex flex-wrap gap-2">
        <Link to="/admin/packages" className="rounded-full border border-kaleo-earth/20 bg-white px-4 py-2 text-xs uppercase tracking-wider">
          Manage tours
        </Link>
        <Link to="/admin/enquiries" className="rounded-full border border-kaleo-earth/20 bg-white px-4 py-2 text-xs uppercase tracking-wider">
          Open bookings
        </Link>
      </section>
    </div>
  );
}

