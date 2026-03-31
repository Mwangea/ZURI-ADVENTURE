import { useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '@/auth/AdminAuthContext';
import { useAdminConfirm } from '@/components/admin/AdminConfirmDialogContext';
import { Check, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type EnquiryStatus = 'NEW' | 'IN_REVIEW' | 'CONFIRMED' | 'CANCELLED';
type EnquiryRow = {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  referenceCode: string | null;
  enquiryType?: 'BOOKING' | 'GENERAL';
  packageName: string | null;
  adventureTitle: string | null;
  status: EnquiryStatus;
  internalNote: string | null;
  createdAt: string;
};

const STATUS_OPTIONS: EnquiryStatus[] = ['NEW', 'IN_REVIEW', 'CONFIRMED', 'CANCELLED'];
const ENQUIRY_FILTER_KEY = 'zuri.admin.enquiries.filters.v1';
const PAGE_SIZE = 20;

type PageMeta = {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

function readStoredFilters() {
  if (typeof window === 'undefined') return { statusFilter: 'ALL', searchInput: '' };
  try {
    const raw = window.localStorage.getItem(ENQUIRY_FILTER_KEY);
    if (!raw) return { statusFilter: 'ALL', searchInput: '' };
    const parsed = JSON.parse(raw) as { statusFilter?: string; searchInput?: string };
    return {
      statusFilter: parsed.statusFilter && parsed.statusFilter.length ? parsed.statusFilter : 'ALL',
      searchInput: parsed.searchInput ?? '',
    };
  } catch {
    return { statusFilter: 'ALL', searchInput: '' };
  }
}

export default function AdminEnquiriesPage() {
  const { authFetch } = useAdminAuth();
  const { confirm } = useAdminConfirm();
  const [rows, setRows] = useState<EnquiryRow[]>([]);
  const [statusDrafts, setStatusDrafts] = useState<Record<number, EnquiryStatus>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [statusFilter, setStatusFilter] = useState<string>(() => readStoredFilters().statusFilter);
  const [searchInput, setSearchInput] = useState<string>(() => readStoredFilters().searchInput);
  const [searchQuery, setSearchQuery] = useState<string>(() => readStoredFilters().searchInput);
  const [page, setPage] = useState<PageMeta>({ total: 0, limit: PAGE_SIZE, offset: 0, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [error, setError] = useState('');

  const load = async (nextOffset = page.offset) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('limit', String(PAGE_SIZE));
      params.set('offset', String(nextOffset));
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (searchQuery.trim()) params.set('q', searchQuery.trim());
      const data = await authFetch<{ enquiries: EnquiryRow[]; page?: PageMeta }>(
        `/api/v1/admin/enquiries?${params.toString()}`,
      );
      const enquiries = data.enquiries ?? [];
      const prevRowMap: Record<number, EnquiryRow> = Object.fromEntries(rows.map((r) => [r.id, r]));
      setRows(enquiries);
      setPage(
        data.page ?? {
          total: enquiries.length,
          limit: PAGE_SIZE,
          offset: nextOffset,
          hasMore: false,
        },
      );
      const statusMap: Record<number, EnquiryStatus> = {};
      const noteMap: Record<number, string> = {};
      enquiries.forEach((e) => {
        const prev = prevRowMap[e.id];
        const prevStatusDraft = statusDrafts[e.id];
        const prevNoteDraft = noteDrafts[e.id];
        const prevWasDirty = prev
          ? (prevStatusDraft ?? prev.status) !== prev.status || (prevNoteDraft ?? '') !== (prev.internalNote ?? '')
          : false;
        statusMap[e.id] = prevWasDirty ? (prevStatusDraft ?? e.status) : e.status;
        noteMap[e.id] = prevWasDirty ? (prevNoteDraft ?? e.internalNote ?? '') : (e.internalNote ?? '');
      });
      setStatusDrafts(statusMap);
      setNoteDrafts(noteMap);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 350);
    return () => {
      window.clearTimeout(timer);
    };
  }, [searchInput]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ENQUIRY_FILTER_KEY, JSON.stringify({ statusFilter, searchInput }));
    }
  }, [statusFilter, searchInput]);

  useEffect(() => {
    setPage((prev) => ({ ...prev, offset: 0 }));
    void load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      // Avoid overriding draft edits while an admin is typing/changing values.
      const hasDirtyDraft = rows.some((r) => isRowDirty(r.id));
      if (!isEditingDraft && savingId == null && deletingId == null && !hasDirtyDraft) {
        void load(page.offset);
      }
    }, 15000);
    return () => {
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.offset, statusFilter, searchQuery, isEditingDraft, savingId, deletingId, rows, statusDrafts, noteDrafts]);

  const groupedCounts = useMemo(() => {
    const out: Record<EnquiryStatus, number> = {
      NEW: 0,
      IN_REVIEW: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
    };
    rows.forEach((r) => {
      out[r.status] += 1;
    });
    return out;
  }, [rows]);

  const rowById = useMemo(() => {
    const out: Record<number, EnquiryRow> = {};
    rows.forEach((row) => {
      out[row.id] = row;
    });
    return out;
  }, [rows]);

  const isRowDirty = (id: number) => {
    const row = rowById[id];
    if (!row) return false;
    const statusChanged = (statusDrafts[id] ?? row.status) !== row.status;
    const noteChanged = (noteDrafts[id] ?? '') !== (row.internalNote ?? '');
    return statusChanged || noteChanged;
  };

  const saveRow = async (id: number) => {
    if (!isRowDirty(id)) return;
    setSavingId(id);
    setError('');
    try {
      await authFetch(`/api/v1/admin/enquiries/${id}`, {
        method: 'PATCH',
        body: {
          status: statusDrafts[id],
          internalNote: noteDrafts[id] ?? '',
        },
      });
      await load(page.offset);
      toast.success('Enquiry updated');
    } catch (err) {
      setError((err as Error).message);
      toast.error((err as Error).message || 'Failed to update enquiry');
    } finally {
      setSavingId(null);
    }
  };

  const deleteRow = async (id: number) => {
    const ok = await confirm({
      title: 'Delete Enquiry',
      message: 'This enquiry will be permanently deleted. Continue?',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    setDeletingId(id);
    setError('');
    try {
      await authFetch(`/api/v1/admin/enquiries/${id}`, { method: 'DELETE' });
      const maybePrevOffset =
        rows.length === 1 && page.offset > 0 ? Math.max(page.offset - page.limit, 0) : page.offset;
      await load(maybePrevOffset);
      toast.success('Enquiry deleted');
    } catch (err) {
      setError((err as Error).message);
      toast.error((err as Error).message || 'Failed to delete enquiry');
    } finally {
      setDeletingId(null);
    }
  };

  const statusClass = (status: EnquiryStatus) => {
    if (status === 'NEW') return 'border-blue-200 bg-blue-50 text-blue-700';
    if (status === 'IN_REVIEW') return 'border-amber-200 bg-amber-50 text-amber-700';
    if (status === 'CONFIRMED') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    return 'border-red-200 bg-red-50 text-red-700';
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[14px] border border-kaleo-earth/10 bg-white p-5 shadow-sm">
        <h1 className="font-display text-[28px] font-bold leading-none text-kaleo-earth">Enquiries</h1>
        <p className="mt-2 font-body text-sm text-kaleo-earth/60">
          Review incoming enquiries. Save applies status/internal note changes for a row.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATUS_OPTIONS.map((s) => (
            <div key={s} className="rounded-[10px] border border-kaleo-earth/10 px-3 py-2">
              <p className="font-body text-[11px] uppercase tracking-wider text-kaleo-earth/60">{s}</p>
              <p className="font-display text-2xl">{groupedCounts[s]}</p>
            </div>
          ))}
        </div>
      </section>

      {error ? <p className="font-body text-sm text-red-600">{error}</p> : null}

      <section className="rounded-[14px] border border-kaleo-earth/10 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl text-kaleo-earth">Enquiry List</h2>
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search guest, email, ref..."
              className="h-10 min-w-[220px] rounded-xl border border-kaleo-earth/20 px-3 text-sm"
            />
            <select
              title="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-xl border border-kaleo-earth/20 px-3 text-sm"
            >
              <option value="ALL">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void load(page.offset)}
              disabled={loading || savingId != null || deletingId != null}
              className="rounded-[9px] border border-kaleo-earth/20 px-3 py-2 text-xs uppercase tracking-wider text-kaleo-earth disabled:opacity-60"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>
        {loading ? (
          <p className="mt-3 font-body text-sm text-kaleo-earth/60">Loading...</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1180px] border-collapse">
              <thead>
                <tr className="border-b border-kaleo-earth/10 text-left font-body text-[11px] uppercase tracking-[.5px] text-kaleo-earth/60">
                  <th className="w-[170px] px-2 py-3">Guest</th>
                  <th className="w-[220px] px-2 py-3">Contact</th>
                  <th className="w-[120px] px-2 py-3">Type</th>
                  <th className="w-[180px] px-2 py-3">Trip</th>
                  <th className="w-[220px] px-2 py-3">Message</th>
                  <th className="w-[150px] px-2 py-3">Status</th>
                  <th className="w-[260px] px-2 py-3">Internal note</th>
                  <th className="w-[110px] px-2 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-kaleo-earth/10 align-top font-body text-sm">
                    <td className="px-2 py-3">
                      <p className="font-medium text-kaleo-earth">{row.fullName}</p>
                      <p className="text-xs text-kaleo-earth/50 whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-2 py-3">
                      <p className="truncate" title={row.email ?? '-'}>
                        {row.email || '-'}
                      </p>
                      <p className="text-xs text-kaleo-earth/60 whitespace-nowrap">{row.phone || '-'}</p>
                    </td>
                    <td className="px-2 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[10px] uppercase tracking-wider ${
                          (row.enquiryType ?? 'GENERAL') === 'BOOKING'
                            ? 'bg-kaleo-terracotta/15 text-kaleo-terracotta'
                            : 'bg-kaleo-earth/10 text-kaleo-earth/70'
                        }`}
                      >
                        {row.enquiryType ?? 'GENERAL'}
                      </span>
                      {row.referenceCode ? (
                        <p className="mt-1 text-[11px] text-kaleo-earth/50 whitespace-nowrap">{row.referenceCode}</p>
                      ) : null}
                    </td>
                    <td className="px-2 py-3">
                      <p className="truncate" title={row.packageName ?? '-'}>
                        {row.packageName || '-'}
                      </p>
                      <p className="text-xs text-kaleo-earth/60 truncate" title={row.adventureTitle ?? '-'}>
                        {row.adventureTitle || '-'}
                      </p>
                    </td>
                    <td className="px-2 py-3">
                      <p className="line-clamp-3" title={row.message ?? '-'}>
                        {row.message || '-'}
                      </p>
                    </td>
                    <td className="px-2 py-3">
                      <select
                        title="Enquiry status"
                        className={`w-[150px] rounded-xl border px-3 py-2 ${statusClass(
                          statusDrafts[row.id] ?? row.status,
                        )}`}
                        value={statusDrafts[row.id] ?? row.status}
                        onFocus={() => setIsEditingDraft(true)}
                        onBlur={() => setIsEditingDraft(false)}
                        onChange={(e) =>
                          setStatusDrafts((prev) => ({
                            ...prev,
                            [row.id]: e.target.value as EnquiryStatus,
                          }))
                        }
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-3">
                      <textarea
                        className="min-h-[72px] w-[240px] rounded-xl border border-kaleo-earth/20 px-3 py-2"
                        placeholder="Internal note (admin only)"
                        value={noteDrafts[row.id] ?? ''}
                        onFocus={() => setIsEditingDraft(true)}
                        onBlur={() => setIsEditingDraft(false)}
                        onChange={(e) =>
                          setNoteDrafts((prev) => ({
                            ...prev,
                            [row.id]: e.target.value,
                          }))
                        }
                      />
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          title="Save changes"
                          aria-label="Save changes"
                          disabled={!isRowDirty(row.id) || savingId === row.id || deletingId === row.id}
                          onClick={() => void saveRow(row.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[9px] bg-kaleo-terracotta text-white disabled:opacity-60"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          type="button"
                          title="Delete enquiry"
                          aria-label="Delete enquiry"
                          disabled={savingId === row.id || deletingId === row.id}
                          onClick={() => void deleteRow(row.id)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-[9px] border border-red-300 text-red-700 disabled:opacity-60"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td colSpan={8} className="px-2 py-6 font-body text-sm text-kaleo-earth/60">
                      No enquiries yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex items-center justify-between border-t border-kaleo-earth/10 pt-4 font-body text-sm text-kaleo-earth/70">
          <p>
            Showing {rows.length ? page.offset + 1 : 0}-{page.offset + rows.length} of {page.total}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading || page.offset === 0}
              onClick={() => void load(Math.max(page.offset - page.limit, 0))}
              className="rounded-[9px] border border-kaleo-earth/20 px-3 py-2 text-xs uppercase tracking-wider disabled:opacity-60"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={loading || !page.hasMore}
              onClick={() => void load(page.offset + page.limit)}
              className="rounded-[9px] border border-kaleo-earth/20 px-3 py-2 text-xs uppercase tracking-wider disabled:opacity-60"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
