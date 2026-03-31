import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useAdminAuth } from '@/auth/AdminAuthContext';
import { useAdminConfirm } from '@/components/admin/AdminConfirmDialogContext';
import { API_BASE } from '@/lib/api';

type AdventureRow = {
  id: number;
  slug: string;
  title: string;
  subtitle: string | null;
  heroImageUrl?: string | null;
  relatedPackageId?: number | null;
  publish: number;
};
type PackageOption = { id: number; name: string };
type AdventureForm = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  heroImageUrl: string;
  relatedPackageId: number | null;
  publish: number;
};

const defaultForm: AdventureForm = {
  slug: '',
  title: '',
  subtitle: '',
  description: '',
  heroImageUrl: '',
  relatedPackageId: null,
  publish: 1,
};

function mediaAbsoluteUrl(srcUrl: string) {
  if (!srcUrl) return '';
  if (srcUrl.startsWith('http://') || srcUrl.startsWith('https://')) return srcUrl;
  return `${API_BASE}${srcUrl.startsWith('/') ? '' : '/'}${srcUrl}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-kaleo-earth/70">{label}</span>
      {children}
    </label>
  );
}

export default function AdminAdventuresPage() {
  const { authFetch } = useAdminAuth();
  const { confirm } = useAdminConfirm();
  const [items, setItems] = useState<AdventureRow[]>([]);
  const [packageOptions, setPackageOptions] = useState<PackageOption[]>([]);
  const [form, setForm] = useState<AdventureForm>(defaultForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [error, setError] = useState('');

  const toSlug = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [adventures, packages] = await Promise.all([
        authFetch<{ adventures: AdventureRow[] }>('/api/v1/admin/adventures'),
        authFetch<{ packages: PackageOption[] }>('/api/v1/admin/packages'),
      ]);
      setItems(adventures.adventures ?? []);
      setPackageOptions(packages.packages ?? []);
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

  useEffect(() => {
    if (slugManuallyEdited) return;
    setForm((prev) => ({ ...prev, slug: toSlug(prev.title) }));
  }, [form.title, slugManuallyEdited]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(defaultForm);
    setSlugManuallyEdited(false);
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  const onEdit = async (row: AdventureRow) => {
    setError('');
    try {
      const detail = await authFetch<{ adventure: AdventureForm }>(`/api/v1/admin/adventures/${row.id}`);
      const a = detail.adventure;
      setEditingId(row.id);
      setForm({
        slug: a.slug ?? row.slug,
        title: a.title ?? row.title,
        subtitle: a.subtitle ?? '',
        description: a.description ?? '',
        heroImageUrl: a.heroImageUrl ?? row.heroImageUrl ?? '',
        relatedPackageId: a.relatedPackageId == null ? null : Number(a.relatedPackageId),
        publish: a.publish ? 1 : 0,
      });
      setSlugManuallyEdited(true);
      setIsModalOpen(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const uploadCoverImage = async (file: File | null) => {
    if (!file) return;
    setUploadingCover(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('files', file);
      const resp = await authFetch<{ files: Array<{ srcUrl: string }> }>('/api/v1/admin/uploads/media', {
        method: 'POST',
        body: fd,
      });
      const src = resp.files?.[0]?.srcUrl;
      if (src) setForm((prev) => ({ ...prev, heroImageUrl: src }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await authFetch(`/api/v1/admin/adventures/${editingId}`, {
          method: 'PUT',
          body: form,
        });
      } else {
        await authFetch('/api/v1/admin/adventures', {
          method: 'POST',
          body: form,
        });
      }
      closeModal();
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (row: AdventureRow) => {
    const ok = await confirm({
      title: 'Delete adventure',
      message: `Delete “${row.title}”? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    setError('');
    try {
      await authFetch(`/api/v1/admin/adventures/${row.id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const relatedPackageName = useMemo(() => {
    const map = new Map<number, string>();
    packageOptions.forEach((p) => map.set(p.id, p.name));
    return map;
  }, [packageOptions]);

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[14px] border border-kaleo-earth/10 bg-white p-5 shadow-sm">
        <h1 className="font-display text-[28px] font-bold leading-none text-kaleo-earth">Adventures</h1>
        <p className="mt-2 font-body text-sm text-kaleo-earth/60">
          Create and manage adventures with cover image and linked package.
        </p>
        <button
          type="button"
          onClick={openCreateModal}
          className="mt-4 rounded-[10px] bg-kaleo-terracotta px-4 py-2 font-body text-xs font-semibold uppercase tracking-wider text-white"
        >
          Add Adventure
        </button>
      </section>

      {isModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[90] min-h-dvh w-screen overflow-y-auto bg-black/65 p-3 sm:p-4 md:p-6">
              <section className="mx-auto min-h-[calc(100dvh-1.5rem)] w-full max-w-4xl rounded-[14px] bg-white p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl">{editingId ? 'Edit Adventure' : 'Add Adventure'}</h2>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-full border border-kaleo-earth/30 px-4 py-2 text-xs"
                  >
                    Close
                  </button>
                </div>
                <form className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                  <Field label="Adventure title">
                    <input
                      className="w-full rounded-xl border border-kaleo-earth/20 px-3 py-2"
                      placeholder="Safari Blue Tour"
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      required
                    />
                  </Field>
                  <Field label="Slug">
                    <div className="flex gap-2">
                      <input
                        className="w-full rounded-xl border border-kaleo-earth/20 px-3 py-2"
                        placeholder="Auto generated"
                        value={form.slug}
                        onChange={(e) => {
                          setSlugManuallyEdited(true);
                          setForm((f) => ({ ...f, slug: toSlug(e.target.value) }));
                        }}
                        required
                      />
                      <button
                        type="button"
                        className="rounded-xl border border-kaleo-earth/30 px-3 py-2 text-xs"
                        onClick={() => {
                          setSlugManuallyEdited(false);
                          setForm((f) => ({ ...f, slug: toSlug(f.title) }));
                        }}
                      >
                        Auto
                      </button>
                    </div>
                  </Field>

                  <Field label="Subtitle">
                    <input
                      className="w-full rounded-xl border border-kaleo-earth/20 px-3 py-2"
                      placeholder="Optional subtitle"
                      value={form.subtitle}
                      onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                    />
                  </Field>
                  <Field label="Related package">
                    <select
                      title="Related package"
                      className="w-full rounded-xl border border-kaleo-earth/20 px-3 py-2"
                      value={form.relatedPackageId == null ? '' : String(form.relatedPackageId)}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          relatedPackageId: e.target.value ? Number(e.target.value) : null,
                        }))
                      }
                    >
                      <option value="">No linked package</option>
                      {packageOptions.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Adventure cover image">
                    <div className="rounded-xl border border-kaleo-earth/10 p-3">
                      {form.heroImageUrl ? (
                        <img
                          src={mediaAbsoluteUrl(form.heroImageUrl)}
                          alt=""
                          className="mb-2 h-24 w-full max-w-xs rounded-lg border border-kaleo-earth/10 object-cover"
                        />
                      ) : (
                        <p className="text-xs text-kaleo-earth/60">No cover image yet</p>
                      )}
                      <p className="truncate text-xs text-kaleo-earth/50">{form.heroImageUrl || ''}</p>
                      <label className="mt-2 inline-block cursor-pointer rounded-full border border-kaleo-earth/30 px-3 py-1 text-xs">
                        {uploadingCover ? 'Uploading...' : 'Upload cover image'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => void uploadCoverImage(e.target.files?.[0] ?? null)}
                        />
                      </label>
                    </div>
                  </Field>

                  <Field label="Publish">
                    <label className="flex h-[42px] items-center gap-2 rounded-xl border border-kaleo-earth/20 px-3 py-2 text-sm">
                      <input
                        type="checkbox"
                        checked={Boolean(form.publish)}
                        onChange={(e) => setForm((f) => ({ ...f, publish: e.target.checked ? 1 : 0 }))}
                      />
                      Publish now
                    </label>
                  </Field>

                  <Field label="Description">
                    <textarea
                      className="min-h-[120px] w-full rounded-xl border border-kaleo-earth/20 px-3 py-2"
                      placeholder="Adventure description"
                      value={form.description}
                      onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    />
                  </Field>

                  <div className="md:col-span-2 flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="rounded-full bg-kaleo-terracotta px-5 py-2 font-body text-xs uppercase tracking-wider text-white disabled:opacity-60"
                    >
                      {submitting ? 'Saving...' : editingId ? 'Update Adventure' : 'Create Adventure'}
                    </button>
                  </div>
                </form>
                {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
              </section>
            </div>,
            document.body,
          )
        : null}

      <section className="rounded-[14px] border border-kaleo-earth/10 bg-white p-5 shadow-sm">
        <h2 className="font-display text-2xl text-kaleo-earth">Adventure List</h2>
        {loading ? (
          <p className="mt-3 font-body text-sm text-kaleo-earth/60">Loading...</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr className="border-b border-kaleo-earth/10 text-left font-body text-[11px] uppercase tracking-[.5px] text-kaleo-earth/60">
                  <th className="px-2 py-3">ID</th>
                  <th className="px-2 py-3">Cover</th>
                  <th className="px-2 py-3">Title</th>
                  <th className="px-2 py-3">Slug</th>
                  <th className="px-2 py-3">Related Package</th>
                  <th className="px-2 py-3">Published</th>
                  <th className="px-2 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-kaleo-earth/10 font-body text-sm">
                    <td className="px-2 py-3">{row.id}</td>
                    <td className="px-2 py-3">
                      {row.heroImageUrl ? (
                        <img
                          src={mediaAbsoluteUrl(row.heroImageUrl)}
                          alt=""
                          className="h-12 w-16 rounded-lg border border-kaleo-earth/10 object-cover"
                        />
                      ) : (
                        <span className="inline-flex h-12 w-16 items-center justify-center rounded-lg border border-dashed border-kaleo-earth/20 text-[10px] text-kaleo-earth/40">
                          -
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3">{row.title}</td>
                    <td className="px-2 py-3">{row.slug}</td>
                    <td className="px-2 py-3">
                      {row.relatedPackageId ? (relatedPackageName.get(row.relatedPackageId) ?? `#${row.relatedPackageId}`) : '-'}
                    </td>
                    <td className="px-2 py-3">{row.publish ? 'Yes' : 'No'}</td>
                    <td className="px-2 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void onEdit(row)}
                          className="rounded-[9px] border border-kaleo-earth/20 px-3 py-1.5 text-xs"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDelete(row)}
                          className="rounded-[9px] border border-red-300 px-3 py-1.5 text-xs text-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length ? (
                  <tr>
                    <td colSpan={7} className="px-2 py-6 font-body text-sm text-kaleo-earth/60">
                      No adventures yet.
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

