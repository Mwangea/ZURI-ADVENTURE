import { useEffect, useMemo, useState } from 'react';
import { useAdminAuth } from '@/auth/AdminAuthContext';

type EnquiryStatus = 'NEW' | 'IN_REVIEW' | 'CONFIRMED' | 'CANCELLED';
type EnquiryRow = {
  id: number;
  fullName: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  packageName: string | null;
  adventureTitle: string | null;
  status: EnquiryStatus;
  internalNote: string | null;
  createdAt: string;
};

const STATUS_OPTIONS: EnquiryStatus[] = ['NEW', 'IN_REVIEW', 'CONFIRMED', 'CANCELLED'];

export default function AdminEnquiriesPage() {
  const { authFetch } = useAdminAuth();
  const [rows, setRows] = useState<EnquiryRow[]>([]);
  const [statusDrafts, setStatusDrafts] = useState<Record<number, EnquiryStatus>>({});
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await authFetch<{ enquiries: EnquiryRow[] }>('/api/v1/admin/enquiries');
      const enquiries = data.enquiries ?? [];
      setRows(enquiries);
      const statusMap: Record<number, EnquiryStatus> = {};
      const noteMap: Record<number, string> = {};
      enquiries.forEach((e) => {
        statusMap[e.id] = e.status;
        noteMap[e.id] = e.internalNote ?? '';
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
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const saveRow = async (id: number) => {
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
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[14px] border border-kaleo-earth/10 bg-white p-5 shadow-sm">
        <h1 className="font-display text-[28px] font-bold leading-none text-kaleo-earth">Enquiries</h1>
        <p className="mt-2 font-body text-sm text-kaleo-earth/60">
          Review incoming enquiries, update status, and save internal notes.
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
        <h2 className="font-display text-2xl text-kaleo-earth">Enquiry List</h2>
        {loading ? (
          <p className="mt-3 font-body text-sm text-kaleo-earth/60">Loading...</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr className="border-b border-kaleo-earth/10 text-left font-body text-[11px] uppercase tracking-[.5px] text-kaleo-earth/60">
                  <th className="px-2 py-3">Guest</th>
                  <th className="px-2 py-3">Contact</th>
                  <th className="px-2 py-3">Trip</th>
                  <th className="px-2 py-3">Message</th>
                  <th className="px-2 py-3">Status</th>
                  <th className="px-2 py-3">Internal note</th>
                  <th className="px-2 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-kaleo-earth/10 align-top font-body text-sm">
                    <td className="px-2 py-3">
                      <p>{row.fullName}</p>
                      <p className="text-xs text-kaleo-earth/50">
                        {new Date(row.createdAt).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-2 py-3">
                      <p>{row.email || '-'}</p>
                      <p className="text-xs text-kaleo-earth/60">{row.phone || '-'}</p>
                    </td>
                    <td className="px-2 py-3">
                      <p>{row.packageName || '-'}</p>
                      <p className="text-xs text-kaleo-earth/60">{row.adventureTitle || '-'}</p>
                    </td>
                    <td className="px-2 py-3 max-w-[260px]">
                      <p className="line-clamp-4">{row.message || '-'}</p>
                    </td>
                    <td className="px-2 py-3">
                      <select
                        title="Enquiry status"
                        className="w-[150px] rounded-xl border border-kaleo-earth/20 px-3 py-2"
                        value={statusDrafts[row.id] ?? row.status}
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
                        placeholder="Internal note"
                        value={noteDrafts[row.id] ?? ''}
                        onChange={(e) =>
                          setNoteDrafts((prev) => ({
                            ...prev,
                            [row.id]: e.target.value,
                          }))
                        }
                      />
                    </td>
                    <td className="px-2 py-3">
                      <button
                        type="button"
                        disabled={savingId === row.id}
                        onClick={() => void saveRow(row.id)}
                        className="rounded-[9px] bg-kaleo-terracotta px-4 py-2 text-xs uppercase tracking-wider text-white disabled:opacity-60"
                      >
                        {savingId === row.id ? 'Saving...' : 'Save'}
                      </button>
                    </td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-6 font-body text-sm text-kaleo-earth/60">
                      No enquiries yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
