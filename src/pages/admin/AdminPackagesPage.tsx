import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { useAdminAuth } from '@/auth/AdminAuthContext';
import { useAdminConfirm } from '@/components/admin/AdminConfirmDialogContext';
import { API_BASE } from '@/lib/api';

type PackageRow = {
  id: number;
  slug: string;
  name: string;
  duration: string;
  publish: number;
  heroImageUrl?: string | null;
};
type PackageForm = {
  slug: string;
  name: string;
  duration: string;
  tourType: string;
  heroImageUrl: string;
  seoDescription: string;
  overview: string;
  priceBase: number;
  priceNote: string;
  tourMapUrl: string;
  maxPeople: number;
  minAge: number;
  schedulingMode: 'FIXED_DEPARTURES' | 'FLEXIBLE_DATES';
  featured: number;
  publish: number;
};
type PricingTier = { minPerson: number; maxPerson: number; pricePerPerson: number; currency: string };
type MediaItem = {
  type: 'IMAGE' | 'VIDEO';
  srcUrl: string;
  videoEmbedUrl?: string;
  title: string;
  caption: string;
  isThumbnail: number;
};

const defaultForm: PackageForm = {
  slug: '',
  name: '',
  duration: '',
  tourType: 'Full Day',
  heroImageUrl: '',
  seoDescription: '',
  overview: '',
  priceBase: 0,
  priceNote: 'per person',
  tourMapUrl: '',
  maxPeople: 30,
  minAge: 10,
  schedulingMode: 'FIXED_DEPARTURES',
  featured: 0,
  publish: 1,
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-kaleo-earth/70">{label}</span>
      {children}
    </label>
  );
}

function mediaAbsoluteUrl(srcUrl: string) {
  if (!srcUrl) return '';
  if (srcUrl.startsWith('http://') || srcUrl.startsWith('https://')) return srcUrl;
  return `${API_BASE}${srcUrl.startsWith('/') ? '' : '/'}${srcUrl}`;
}

function toEmbeddedVideoUrl(url: string) {
  const value = url.trim();
  if (!value) return '';
  try {
    const parsed = new URL(value);

    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
      const shorts = parsed.pathname.match(/^\/shorts\/([^/?#]+)/);
      if (shorts?.[1]) return `https://www.youtube.com/embed/${shorts[1]}`;
      const embed = parsed.pathname.match(/^\/embed\/([^/?#]+)/);
      if (embed?.[1]) return `https://www.youtube.com/embed/${embed[1]}`;
    }

    if (parsed.hostname === 'youtu.be') {
      const shortId = parsed.pathname.replace('/', '').split('/')[0];
      if (shortId) return `https://www.youtube.com/embed/${shortId}`;
    }

    if (parsed.hostname.includes('vimeo.com')) {
      const match = parsed.pathname.match(/\/(\d+)/);
      if (match?.[1]) return `https://player.vimeo.com/video/${match[1]}`;
    }
  } catch {
    return '';
  }
  return '';
}

function ChipEditor({
  title,
  value,
  onChange,
  placeholder,
}: {
  title: string;
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}) {
  const { confirm } = useAdminConfirm();
  const [draft, setDraft] = useState('');
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs uppercase tracking-wider text-kaleo-earth/70">{title}</p>
      <div className="mt-2 flex gap-2">
        <input
          className="flex-1 rounded-xl border px-3 py-2"
          value={draft}
          placeholder={placeholder}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button
          type="button"
          className="rounded-xl border px-3 py-2 text-xs"
          onClick={() => {
            const v = draft.trim();
            if (!v) return;
            onChange([...value, v]);
            setDraft('');
          }}
        >
          Add
        </button>
      </div>
      <div className="mt-2 space-y-2">
        {value.map((v, idx) => (
          <div key={`${v}-${idx}`} className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
            <span>{v}</span>
            <button
              type="button"
              className="text-xs text-red-600"
              onClick={() =>
                void (async () => {
                  const ok = await confirm({
                    title: 'Remove item',
                    message: `Remove this ${title.toLowerCase()} line?`,
                    confirmLabel: 'Remove',
                    cancelLabel: 'Cancel',
                  });
                  if (ok) onChange(value.filter((_x, i) => i !== idx));
                })()
              }
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminPackagesPage() {
  const { authFetch } = useAdminAuth();
  const { confirm } = useAdminConfirm();
  const [items, setItems] = useState<PackageRow[]>([]);
  const [form, setForm] = useState<PackageForm>(defaultForm);
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [highlights, setHighlights] = useState<string[]>([]);
  const [included, setIncluded] = useState<string[]>([]);
  const [excluded, setExcluded] = useState<string[]>([]);
  const [relatedPackageIds, setRelatedPackageIds] = useState<number[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [error, setError] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const relatedOptions = useMemo(
    () => items.filter((x) => (editingId ? x.id !== editingId : true)),
    [items, editingId],
  );

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
      const data = await authFetch<{ packages: PackageRow[] }>('/api/v1/admin/packages');
      setItems(data.packages ?? []);
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
    setForm((prev) => ({ ...prev, slug: toSlug(prev.name) }));
  }, [form.name, slugManuallyEdited]);

  const openNewModal = () => {
    setEditingId(null);
    setForm(defaultForm);
    setPricingTiers([]);
    setMediaItems([]);
    setHighlights([]);
    setIncluded([]);
    setExcluded([]);
    setRelatedPackageIds([]);
    setSlugManuallyEdited(false);
    setError('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setError('');
  };

  const onEdit = async (row: PackageRow) => {
    try {
      const detail = await authFetch<{ package: any }>(`/api/v1/admin/packages/${row.id}`);
      const p = detail.package ?? {};
      setEditingId(row.id);
      setForm({
        slug: p.slug || row.slug,
        name: p.name || row.name,
        duration: p.duration || '',
        tourType: p.tourType || 'Full Day',
        heroImageUrl: p.heroImageUrl || '',
        seoDescription: p.seoDescription || '',
        overview: p.overview || '',
        priceBase: Number(p.priceBase ?? 0),
        priceNote: p.priceNote || 'per person',
        tourMapUrl: p.tourMapUrl || '',
        maxPeople: Number(p.maxPeople ?? 30),
        minAge: Number(p.minAge ?? 10),
        schedulingMode: p.schedulingMode === 'FLEXIBLE_DATES' ? 'FLEXIBLE_DATES' : 'FIXED_DEPARTURES',
        featured: p.featured ? 1 : 0,
        publish: p.publish ? 1 : 0,
      });
      setPricingTiers((p.pricingTiers ?? []).map((t: any) => ({ ...t })));
      setMediaItems(
        (p.media ?? []).map((m: any) => ({
          type: m.type === 'VIDEO' ? 'VIDEO' : 'IMAGE',
          srcUrl: m.srcUrl ?? '',
          videoEmbedUrl: m.videoEmbedUrl ?? '',
          title: m.title ?? '',
          caption: m.caption ?? '',
          isThumbnail: m.isThumbnail ? 1 : 0,
        })),
      );
      setHighlights(p.tourHighlights ?? []);
      setIncluded(p.included ?? []);
      setExcluded(p.excluded ?? []);
      setRelatedPackageIds((p.relatedPackageIds ?? []).map((x: unknown) => Number(x)).filter((x: number) => Number.isFinite(x)));
      setSlugManuallyEdited(true);
      setError('');
      setIsModalOpen(true);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const uploadMediaFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploadingMedia(true);
    try {
      const fd = new FormData();
      Array.from(files).forEach((f) => fd.append('files', f));
      const resp = await authFetch<{ files: Array<{ type: 'IMAGE' | 'VIDEO'; srcUrl: string }> }>(
        '/api/v1/admin/uploads/media',
        { method: 'POST', body: fd },
      );
      setMediaItems((prev) => [
        ...prev,
        ...(resp.files ?? []).map((f) => ({
          type: f.type,
          srcUrl: f.srcUrl,
          videoEmbedUrl: '',
          title: '',
          caption: '',
          isThumbnail: 0,
        })),
      ]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        pricingTiers,
        media: mediaItems.map((m, i) => ({ ...m, sortOrder: i })),
        tourHighlights: highlights,
        included,
        excluded,
        relatedPackageIds,
      };
      if (editingId) {
        await authFetch(`/api/v1/admin/packages/${editingId}`, { method: 'PUT', body: payload });
      } else {
        await authFetch('/api/v1/admin/packages', { method: 'POST', body: payload });
      }
      closeModal();
      await load();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: number, name: string) => {
    const ok = await confirm({
      title: 'Delete package',
      message: `Delete “${name}”? This cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await authFetch(`/api/v1/admin/packages/${id}`, { method: 'DELETE' });
      await load();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-[14px] border border-kaleo-earth/10 bg-white p-5 shadow-sm">
        <h1 className="font-display text-[28px] font-bold leading-none text-kaleo-earth">Packages</h1>
        <p className="mt-2 text-sm text-kaleo-earth/60">Upload media, set thumbnail, and publish packages from one modal.</p>
        <button type="button" onClick={openNewModal} className="mt-4 rounded-[10px] bg-kaleo-terracotta px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white">
          Add Package
        </button>
      </section>

      {isModalOpen
        ? createPortal(
            <div className="fixed inset-0 z-[90] min-h-dvh w-screen overflow-y-auto bg-black/65 p-3 sm:p-4 md:p-6">
              <section className="mx-auto min-h-[calc(100dvh-1.5rem)] w-full max-w-6xl rounded-[14px] bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">{editingId ? 'Edit Package' : 'Add Package'}</h2>
              <button type="button" onClick={closeModal} className="rounded-full border px-4 py-2 text-xs">
                Close
              </button>
            </div>

            <form className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
              <Field label="Package name">
                <input className="w-full rounded-xl border px-3 py-2" placeholder="Prison Island & Nakupenda" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </Field>
              <Field label="Slug">
                <div className="flex gap-2">
                  <input
                    className="w-full rounded-xl border px-3 py-2"
                    placeholder="Auto-generated from name"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugManuallyEdited(true);
                      setForm((f) => ({ ...f, slug: toSlug(e.target.value) }));
                    }}
                    required
                  />
                  <button
                    type="button"
                    className="rounded-xl border px-3 py-2 text-xs"
                    onClick={() => {
                      setSlugManuallyEdited(false);
                      setForm((f) => ({ ...f, slug: toSlug(f.name) }));
                    }}
                  >
                    Auto
                  </button>
                </div>
              </Field>

              <Field label="Duration">
                <input className="w-full rounded-xl border px-3 py-2" placeholder="8 hours" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} required />
              </Field>
              <Field label="Tour type">
                <input className="w-full rounded-xl border px-3 py-2" placeholder="Full Day" value={form.tourType} onChange={(e) => setForm((f) => ({ ...f, tourType: e.target.value }))} />
              </Field>

              <Field label="Base price">
                <input type="number" className="w-full rounded-xl border px-3 py-2" placeholder="100" value={form.priceBase} onChange={(e) => setForm((f) => ({ ...f, priceBase: Number(e.target.value || 0) }))} />
              </Field>
              <Field label="Price note">
                <input className="w-full rounded-xl border px-3 py-2" placeholder="per person" value={form.priceNote} onChange={(e) => setForm((f) => ({ ...f, priceNote: e.target.value }))} />
              </Field>

              <Field label="Max people">
                <input type="number" className="w-full rounded-xl border px-3 py-2" placeholder="30" value={form.maxPeople} onChange={(e) => setForm((f) => ({ ...f, maxPeople: Number(e.target.value || 0) }))} />
              </Field>
              <Field label="Minimum age">
                <input type="number" className="w-full rounded-xl border px-3 py-2" placeholder="10" value={form.minAge} onChange={(e) => setForm((f) => ({ ...f, minAge: Number(e.target.value || 0) }))} />
              </Field>

              <Field label="Scheduling mode">
                <select title="Scheduling mode" className="w-full rounded-xl border px-3 py-2" value={form.schedulingMode} onChange={(e) => setForm((f) => ({ ...f, schedulingMode: e.target.value as PackageForm['schedulingMode'] }))}>
                  <option value="FIXED_DEPARTURES">Fixed departures</option>
                  <option value="FLEXIBLE_DATES">Flexible dates</option>
                </select>
              </Field>
              <Field label="Tour map URL">
                <input className="w-full rounded-xl border px-3 py-2" placeholder="Google map link" value={form.tourMapUrl} onChange={(e) => setForm((f) => ({ ...f, tourMapUrl: e.target.value }))} />
              </Field>

              <Field label="Package cover image">
                <div className="rounded-xl border p-3">
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
                  <label className="mt-2 inline-block cursor-pointer rounded-full border px-3 py-1 text-xs">
                    Upload cover image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append('files', file);
                        try {
                          const resp = await authFetch<{ files: Array<{ srcUrl: string }> }>('/api/v1/admin/uploads/media', { method: 'POST', body: fd });
                          const src = resp.files?.[0]?.srcUrl;
                          if (src) setForm((f) => ({ ...f, heroImageUrl: src }));
                        } catch (err) {
                          setError((err as Error).message);
                        }
                      }}
                    />
                  </label>
                </div>
              </Field>

              <Field label="Related packages">
                <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border p-3">
                  {!relatedOptions.length ? <p className="text-sm text-kaleo-earth/60">No other packages available yet.</p> : null}
                  {relatedOptions.map((pkg) => (
                    <label key={pkg.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={relatedPackageIds.includes(pkg.id)}
                        onChange={(e) =>
                          setRelatedPackageIds((prev) =>
                            e.target.checked ? [...prev, pkg.id] : prev.filter((id) => id !== pkg.id),
                          )
                        }
                      />
                      {pkg.name}
                    </label>
                  ))}
                </div>
              </Field>

              <Field label="SEO description">
                <textarea className="min-h-[80px] w-full rounded-xl border px-3 py-2" placeholder="Short summary for search engines" value={form.seoDescription} onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))} />
              </Field>
              <Field label="Overview">
                <textarea className="min-h-[80px] w-full rounded-xl border px-3 py-2" placeholder="Full package description" value={form.overview} onChange={(e) => setForm((f) => ({ ...f, overview: e.target.value }))} />
              </Field>

              <div className="md:col-span-2 rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-kaleo-earth/70">Pricing tiers</p>
                  <button
                    type="button"
                    className="rounded-full border px-3 py-1 text-xs"
                    onClick={() => setPricingTiers((prev) => [...prev, { minPerson: 1, maxPerson: 2, pricePerPerson: 100, currency: 'USD' }])}
                  >
                    Add tier
                  </button>
                </div>
                <div className="mt-2 space-y-2">
                  {pricingTiers.map((tier, idx) => (
                    <div key={`${idx}-${tier.minPerson}-${tier.maxPerson}`} className="grid grid-cols-1 gap-2 md:grid-cols-5">
                      <input type="number" className="rounded-xl border px-3 py-2" placeholder="Min persons" value={tier.minPerson} onChange={(e) => setPricingTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, minPerson: Number(e.target.value || 1) } : t)))} />
                      <input type="number" className="rounded-xl border px-3 py-2" placeholder="Max persons" value={tier.maxPerson} onChange={(e) => setPricingTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, maxPerson: Number(e.target.value || 1) } : t)))} />
                      <input type="number" className="rounded-xl border px-3 py-2" placeholder="Price per person" value={tier.pricePerPerson} onChange={(e) => setPricingTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, pricePerPerson: Number(e.target.value || 0) } : t)))} />
                      <input className="rounded-xl border px-3 py-2" placeholder="Currency (USD)" value={tier.currency} onChange={(e) => setPricingTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, currency: e.target.value || 'USD' } : t)))} />
                      <button
                        type="button"
                        className="rounded-xl border border-red-300 px-3 py-2 text-xs text-red-600"
                        onClick={() =>
                          void (async () => {
                            const ok = await confirm({
                              title: 'Remove pricing tier',
                              message: 'Remove this price tier row?',
                              confirmLabel: 'Remove',
                              cancelLabel: 'Cancel',
                            });
                            if (ok) setPricingTiers((prev) => prev.filter((_t, i) => i !== idx));
                          })()
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2 rounded-xl border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wider text-kaleo-earth/70">Media (multiple uploads)</p>
                  <label className="cursor-pointer rounded-full border px-3 py-1 text-xs">
                    {uploadingMedia ? 'Uploading...' : 'Upload images/videos'}
                    <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={(e) => void uploadMediaFiles(e.target.files)} />
                  </label>
                </div>
                <div className="mt-3 rounded-xl border border-dashed p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-kaleo-earth/60">Add video by URL (YouTube/Vimeo)</p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      className="w-full rounded-xl border px-3 py-2"
                      placeholder="https://www.youtube.com/watch?v=..."
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return;
                        e.preventDefault();
                        const target = e.currentTarget;
                        const raw = target.value.trim();
                        if (!raw) return;
                        const embedUrl = toEmbeddedVideoUrl(raw);
                        if (!embedUrl) {
                          setError('Invalid embed URL. Please use YouTube or Vimeo link.');
                          return;
                        }
                        setMediaItems((prev) => [
                          ...prev,
                          {
                            type: 'VIDEO',
                            srcUrl: '',
                            videoEmbedUrl: raw,
                            title: '',
                            caption: '',
                            isThumbnail: 0,
                          },
                        ]);
                        setError('');
                        target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      className="rounded-xl border px-3 py-2 text-xs"
                      onClick={(e) => {
                        const container = e.currentTarget.closest('div');
                        const input = container?.querySelector('input');
                        const raw = input?.value.trim() ?? '';
                        if (!raw) return;
                        const embedUrl = toEmbeddedVideoUrl(raw);
                        if (!embedUrl) {
                          setError('Invalid embed URL. Please use YouTube or Vimeo link.');
                          return;
                        }
                        setMediaItems((prev) => [
                          ...prev,
                          {
                            type: 'VIDEO',
                            srcUrl: '',
                            videoEmbedUrl: raw,
                            title: '',
                            caption: '',
                            isThumbnail: 0,
                          },
                        ]);
                        setError('');
                        if (input) input.value = '';
                      }}
                    >
                      Add embed video
                    </button>
                  </div>
                </div>
                <div className="mt-2 space-y-3">
                  {mediaItems.map((m, idx) => (
                    <div
                      key={`${m.srcUrl}-${idx}`}
                      className="grid grid-cols-1 gap-3 rounded-xl border p-3 sm:grid-cols-[96px_1fr] md:grid-cols-[112px_1fr_auto_auto]"
                    >
                      <div className="flex items-start justify-center sm:row-span-2 md:row-span-1">
                        {m.type === 'IMAGE' ? (
                          <img
                            src={mediaAbsoluteUrl(m.srcUrl)}
                            alt=""
                            className="h-20 w-full max-w-[112px] rounded-lg border border-kaleo-earth/10 object-cover sm:h-24"
                          />
                        ) : m.videoEmbedUrl ? (
                          toEmbeddedVideoUrl(m.videoEmbedUrl) ? (
                            <iframe
                              src={toEmbeddedVideoUrl(m.videoEmbedUrl)}
                              title="Embedded video preview"
                              className="h-20 w-full max-w-[112px] rounded-lg border border-kaleo-earth/10 sm:h-24"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              referrerPolicy="strict-origin-when-cross-origin"
                            />
                          ) : (
                            <div className="grid h-20 w-full max-w-[112px] place-items-center rounded-lg border border-kaleo-earth/10 bg-kaleo-sand/40 text-[10px] text-kaleo-earth/60 sm:h-24">
                              Invalid URL
                            </div>
                          )
                        ) : (
                          <video
                            src={mediaAbsoluteUrl(m.srcUrl)}
                            className="h-20 w-full max-w-[112px] rounded-lg border border-kaleo-earth/10 object-cover sm:h-24"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        )}
                      </div>
                      <div className="min-w-0 space-y-2 md:col-span-1">
                        <p className="truncate text-xs text-kaleo-earth/60">{m.type}</p>
                        <p className="truncate font-mono text-[11px] text-kaleo-earth/50">{m.videoEmbedUrl || m.srcUrl}</p>
                        {m.type === 'VIDEO' && m.videoEmbedUrl ? (
                          <input
                            className="w-full rounded-xl border px-3 py-2"
                            placeholder="Embed URL"
                            value={m.videoEmbedUrl}
                            onChange={(e) =>
                              setMediaItems((prev) =>
                                prev.map((x, i) => (i === idx ? { ...x, videoEmbedUrl: e.target.value } : x)),
                              )
                            }
                          />
                        ) : null}
                        <input className="w-full rounded-xl border px-3 py-2" placeholder="Title" value={m.title} onChange={(e) => setMediaItems((prev) => prev.map((x, i) => (i === idx ? { ...x, title: e.target.value } : x)))} />
                        <input className="w-full rounded-xl border px-3 py-2" placeholder="Caption" value={m.caption} onChange={(e) => setMediaItems((prev) => prev.map((x, i) => (i === idx ? { ...x, caption: e.target.value } : x)))} />
                      </div>
                      <label className="flex items-center gap-2 self-center rounded-xl border px-3 py-2 text-xs md:flex-col md:items-start">
                        <input type="checkbox" checked={Boolean(m.isThumbnail)} onChange={(e) => setMediaItems((prev) => prev.map((x, i) => ({ ...x, isThumbnail: i === idx && e.target.checked ? 1 : 0 })))} />
                        Thumbnail
                      </label>
                      <button
                        type="button"
                        className="self-center rounded-xl border border-red-300 px-3 py-2 text-xs text-red-600"
                        onClick={() =>
                          void (async () => {
                            const ok = await confirm({
                              title: 'Remove media',
                              message: 'Remove this image or video from the gallery?',
                              confirmLabel: 'Remove',
                              cancelLabel: 'Cancel',
                            });
                            if (ok) setMediaItems((prev) => prev.filter((_x, i) => i !== idx));
                          })()
                        }
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <ChipEditor title="Tour highlights" value={highlights} onChange={setHighlights} placeholder="Add a highlight" />
              <ChipEditor title="Included" value={included} onChange={setIncluded} placeholder="Add included item" />
              <ChipEditor title="Excluded" value={excluded} onChange={setExcluded} placeholder="Add excluded item" />

              <div className="md:col-span-2 flex flex-wrap items-center gap-4 rounded-xl border p-3">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={Boolean(form.featured)} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked ? 1 : 0 }))} />
                  Featured package
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={Boolean(form.publish)} onChange={(e) => setForm((f) => ({ ...f, publish: e.target.checked ? 1 : 0 }))} />
                  Publish now
                </label>
              </div>

              <div className="md:col-span-2 flex gap-2">
                <button type="submit" disabled={submitting} className="rounded-full bg-kaleo-terracotta px-5 py-2 text-xs uppercase tracking-wider text-white disabled:opacity-60">
                  {submitting ? 'Saving...' : editingId ? 'Update Package' : 'Create Package'}
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
        <h2 className="font-display text-2xl text-kaleo-earth">Package List</h2>
        {loading ? <p className="mt-3 text-sm text-kaleo-earth/60">Loading...</p> : null}
        {!loading ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[800px] border-collapse">
              <thead>
                <tr className="border-b border-kaleo-earth/10 text-left text-[11px] uppercase tracking-[.5px] text-kaleo-earth/60">
                  <th className="px-2 py-3">ID</th>
                  <th className="px-2 py-3">Cover</th>
                  <th className="px-2 py-3">Name</th>
                  <th className="px-2 py-3">Slug</th>
                  <th className="px-2 py-3">Duration</th>
                  <th className="px-2 py-3">Published</th>
                  <th className="px-2 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-b border-kaleo-earth/10 text-sm">
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
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-3">{row.name}</td>
                    <td className="px-2 py-3">{row.slug}</td>
                    <td className="px-2 py-3">{row.duration}</td>
                    <td className="px-2 py-3">{row.publish ? 'Yes' : 'No'}</td>
                    <td className="px-2 py-3">
                      <div className="flex gap-2">
                        <button type="button" onClick={() => void onEdit(row)} className="rounded-[9px] border border-kaleo-earth/20 px-3 py-1.5 text-xs">
                          Edit
                        </button>
                        <button type="button" onClick={() => void onDelete(row.id, row.name)} className="rounded-[9px] border border-red-300 px-3 py-1.5 text-xs text-red-600">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}

