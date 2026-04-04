import { useEffect, useState } from 'react';
import { useAdminAuth } from '@/auth/AdminAuthContext';
import { useAdminConfirm } from '@/components/admin/AdminConfirmDialogContext';
import { API_BASE } from '@/lib/api';
import { toast } from 'sonner';

type HeroPayload = {
  title: string;
  subtitle: string;
  cta_label: string;
  cta_link: string;
  background_image_url: string | null;
  publish: number;
};

type TestimonialRow = {
  id: number;
  quote: string;
  author_name: string;
  location: string | null;
  avatar_url: string | null;
  rating: number | null;
  trip_label: string | null;
  publish: number;
  sort_order: number;
};

type BannerPayload = {
  enabled: number;
  message: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_link: string | null;
  start_at: string | null;
  end_at: string | null;
};

type PolicyRow = {
  id: number;
  type: 'TERMS' | 'PRIVACY' | 'CANCELLATION';
  slug: string;
  title: string;
  body: string;
  publish: number;
};

type GalleryRow = {
  id: number;
  media_type: 'IMAGE' | 'VIDEO';
  src_url: string | null;
  video_embed_url: string | null;
  title: string | null;
  caption: string | null;
  section_key: string | null;
  publish: number;
  sort_order: number;
};

type PolicyType = 'TERMS' | 'PRIVACY' | 'CANCELLATION';
type NewPolicyState = {
  type: PolicyType;
  slug: string;
  title: string;
  body: string;
  publish: number;
};

const PANEL =
  'rounded-[14px] border border-kaleo-earth/10 bg-white p-5 shadow-sm';
const FILE_PICKER_BUTTON =
  'inline-flex items-center gap-2 rounded-[10px] border border-kaleo-earth/25 bg-kaleo-sand px-4 py-2 text-xs font-semibold uppercase tracking-wider text-kaleo-earth transition hover:border-kaleo-terracotta hover:text-kaleo-terracotta disabled:cursor-not-allowed disabled:opacity-60';

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function toDateTimeInputValue(value: string | null) {
  if (!value) return '';
  const normalized = value.replace(' ', 'T');
  return normalized.slice(0, 16);
}

function fromDateTimeInputValue(value: string | null) {
  if (!value) return null;
  const base = value.replace('T', ' ');
  return base.length === 16 ? `${base}:00` : base;
}

function toAbsoluteMediaUrl(srcUrl?: string | null) {
  if (!srcUrl) return '';
  if (srcUrl.startsWith('http://') || srcUrl.startsWith('https://')) return srcUrl;
  return `${API_BASE}${srcUrl.startsWith('/') ? '' : '/'}${srcUrl}`;
}

export default function AdminContentPage() {
  const { authFetch } = useAdminAuth();
  const { confirm } = useAdminConfirm();

  const [loading, setLoading] = useState(true);

  const [hero, setHero] = useState<HeroPayload>({
    title: '',
    subtitle: '',
    cta_label: '',
    cta_link: '',
    background_image_url: '',
    publish: 1,
  });

  const [testimonials, setTestimonials] = useState<TestimonialRow[]>([]);
  const [newTestimonial, setNewTestimonial] = useState({
    quote: '',
    author_name: '',
    location: '',
    avatar_url: '',
    rating: 5,
    trip_label: '',
    publish: 1,
  });

  const [banner, setBanner] = useState<BannerPayload>({
    enabled: 0,
    message: '',
    image_url: '',
    cta_label: '',
    cta_link: '',
    start_at: '',
    end_at: '',
  });

  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [newPolicy, setNewPolicy] = useState<NewPolicyState>({
    type: 'TERMS',
    slug: '',
    title: '',
    body: '',
    publish: 1,
  });
  const [newPolicySlugTouched, setNewPolicySlugTouched] = useState(false);

  const [gallery, setGallery] = useState<GalleryRow[]>([]);
  const [newMedia, setNewMedia] = useState({
    media_type: 'IMAGE' as 'IMAGE' | 'VIDEO',
    src_url: '',
    video_embed_url: '',
    title: '',
    caption: '',
    section_key: '',
    publish: 1,
  });
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingBannerImage, setUploadingBannerImage] = useState(false);
  const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);
  const [uploadingGalleryVideo, setUploadingGalleryVideo] = useState(false);

  const uploadMediaFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return [];
    const form = new FormData();
    Array.from(files).forEach((file) => form.append('files', file));
    const resp = await authFetch<{ files?: Array<{ srcUrl?: string; url?: string }> }>(
      '/api/v1/admin/uploads/media',
      {
      method: 'POST',
      body: form,
      },
    );
    return (resp.files ?? [])
      .map((f) => f.srcUrl ?? f.url)
      .filter((u): u is string => typeof u === 'string' && Boolean(u));
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      const [heroData, testimonialsData, bannerData, policiesData, galleryData] = await Promise.all([
        authFetch<{ hero: HeroPayload | null }>('/api/v1/admin/content/hero'),
        authFetch<{ testimonials: TestimonialRow[] }>('/api/v1/admin/content/testimonials'),
        authFetch<{ banner: BannerPayload | null }>('/api/v1/admin/content/promo-banner'),
        authFetch<{ policies: PolicyRow[] }>('/api/v1/admin/content/policies'),
        authFetch<{ media: GalleryRow[] }>('/api/v1/admin/content/gallery'),
      ]);
      setHero(
        heroData.hero ?? {
          title: '',
          subtitle: '',
          cta_label: '',
          cta_link: '',
          background_image_url: '',
          publish: 1,
        },
      );
      setTestimonials(testimonialsData.testimonials ?? []);
      const rawBanner =
        bannerData.banner ?? {
          enabled: 0,
          message: '',
          image_url: '',
          cta_label: '',
          cta_link: '',
          start_at: '',
          end_at: '',
        };
      setBanner({
        ...rawBanner,
        start_at: toDateTimeInputValue(rawBanner.start_at),
        end_at: toDateTimeInputValue(rawBanner.end_at),
      });
      setPolicies(policiesData.policies ?? []);
      setGallery(galleryData.media ?? []);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveHero = async () => {
    try {
      await authFetch('/api/v1/admin/content/hero', {
        method: 'PUT',
        body: {
          title: hero.title,
          subtitle: hero.subtitle,
          ctaLabel: hero.cta_label,
          ctaLink: hero.cta_link,
          backgroundImageUrl: hero.background_image_url || null,
          publish: hero.publish,
        },
      });
      toast.success('Hero saved');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save hero');
    }
  };

  const createTestimonial = async () => {
    if (!newTestimonial.quote.trim() || !newTestimonial.author_name.trim()) {
      toast.error('Quote and author are required');
      return;
    }
    try {
      await authFetch('/api/v1/admin/content/testimonials', {
        method: 'POST',
        body: {
          quote: newTestimonial.quote,
          authorName: newTestimonial.author_name,
          location: newTestimonial.location || null,
          avatarUrl: newTestimonial.avatar_url || null,
          rating: newTestimonial.rating,
          tripLabel: newTestimonial.trip_label || null,
          publish: newTestimonial.publish,
          sortOrder: testimonials.length,
        },
      });
      setNewTestimonial({
        quote: '',
        author_name: '',
        location: '',
        avatar_url: '',
        rating: 5,
        trip_label: '',
        publish: 1,
      });
      await loadAll();
      toast.success('Testimonial created');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to create testimonial');
    }
  };

  const updateTestimonial = async (row: TestimonialRow) => {
    try {
      await authFetch(`/api/v1/admin/content/testimonials/${row.id}`, {
        method: 'PUT',
        body: {
          quote: row.quote,
          authorName: row.author_name,
          location: row.location,
          avatarUrl: row.avatar_url,
          rating: row.rating,
          tripLabel: row.trip_label,
          publish: row.publish,
          sortOrder: row.sort_order,
        },
      });
      toast.success('Testimonial saved');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save testimonial');
    }
  };

  const deleteTestimonial = async (id: number) => {
    const ok = await confirm({
      title: 'Delete testimonial',
      message: 'This testimonial will be permanently deleted.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await authFetch(`/api/v1/admin/content/testimonials/${id}`, { method: 'DELETE' });
      await loadAll();
      toast.success('Testimonial deleted');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete testimonial');
    }
  };

  const saveBanner = async () => {
    try {
      await authFetch('/api/v1/admin/content/promo-banner', {
        method: 'PUT',
        body: {
          enabled: banner.enabled,
          message: banner.message || null,
          imageUrl: banner.image_url || null,
          ctaLabel: banner.cta_label || null,
          ctaLink: banner.cta_link || null,
          startAt: fromDateTimeInputValue(banner.start_at),
          endAt: fromDateTimeInputValue(banner.end_at),
        },
      });
      toast.success('Promo banner saved');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save banner');
    }
  };

  const clearBannerForm = () => {
    setBanner({
      enabled: 0,
      message: '',
      image_url: '',
      cta_label: '',
      cta_link: '',
      start_at: '',
      end_at: '',
    });
  };

  const createPolicy = async () => {
    if (!newPolicy.slug.trim() || !newPolicy.title.trim()) {
      toast.error('Slug and title are required');
      return;
    }
    try {
      await authFetch('/api/v1/admin/content/policies', {
        method: 'POST',
        body: {
          type: newPolicy.type,
          slug: newPolicy.slug,
          title: newPolicy.title,
          body: newPolicy.body,
          publish: newPolicy.publish,
        },
      });
      setNewPolicy({ type: 'TERMS', slug: '', title: '', body: '', publish: 1 });
      setNewPolicySlugTouched(false);
      await loadAll();
      toast.success('Policy created');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to create policy');
    }
  };

  const updatePolicy = async (row: PolicyRow) => {
    try {
      await authFetch(`/api/v1/admin/content/policies/${row.id}`, {
        method: 'PUT',
        body: {
          type: row.type,
          slug: row.slug,
          title: row.title,
          body: row.body,
          publish: row.publish,
        },
      });
      toast.success('Policy saved');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save policy');
    }
  };

  const deletePolicy = async (id: number) => {
    const ok = await confirm({
      title: 'Delete policy',
      message: 'This policy record will be permanently deleted.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await authFetch(`/api/v1/admin/content/policies/${id}`, { method: 'DELETE' });
      await loadAll();
      toast.success('Policy deleted');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete policy');
    }
  };

  const createMedia = async () => {
    const isImage = newMedia.media_type === 'IMAGE';
    if (isImage && !newMedia.src_url.trim()) {
      toast.error('Image URL is required');
      return;
    }
    if (!isImage && !newMedia.video_embed_url.trim() && !newMedia.src_url.trim()) {
      toast.error('Provide either a video file URL or a video embed URL');
      return;
    }
    try {
      await authFetch('/api/v1/admin/content/gallery', {
        method: 'POST',
        body: {
          mediaType: newMedia.media_type,
          srcUrl: newMedia.src_url || null,
          videoEmbedUrl: newMedia.video_embed_url || null,
          title: newMedia.title || null,
          caption: newMedia.caption || null,
          sectionKey: newMedia.section_key || null,
          publish: newMedia.publish,
          sortOrder: gallery.length,
        },
      });
      setNewMedia({
        media_type: 'IMAGE',
        src_url: '',
        video_embed_url: '',
        title: '',
        caption: '',
        section_key: '',
        publish: 1,
      });
      await loadAll();
      toast.success('Gallery media created');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to create media');
    }
  };

  const updateMedia = async (row: GalleryRow) => {
    try {
      await authFetch(`/api/v1/admin/content/gallery/${row.id}`, {
        method: 'PUT',
        body: {
          mediaType: row.media_type,
          srcUrl: row.src_url,
          videoEmbedUrl: row.video_embed_url,
          title: row.title,
          caption: row.caption,
          sectionKey: row.section_key,
          publish: row.publish,
          sortOrder: row.sort_order,
        },
      });
      toast.success('Gallery media saved');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save media');
    }
  };

  const deleteMedia = async (id: number) => {
    const ok = await confirm({
      title: 'Delete media',
      message: 'This gallery media item will be permanently deleted.',
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
    });
    if (!ok) return;
    try {
      await authFetch(`/api/v1/admin/content/gallery/${id}`, { method: 'DELETE' });
      await loadAll();
      toast.success('Gallery media deleted');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to delete media');
    }
  };

  if (loading) return <p className="font-body text-sm text-kaleo-earth/60">Loading content modules...</p>;

  return (
    <div className="flex min-h-full flex-col gap-5 bg-[#f4f5f7] pb-2">
      <section className={PANEL}>
        <h1 className="font-display text-[28px] font-bold leading-none text-kaleo-earth">Content Admin</h1>
        <p className="mt-2 font-body text-sm text-kaleo-earth/60">
          Manage homepage marketing content, policies, and gallery media from one place.
        </p>
      </section>

      <section className={PANEL}>
        <h2 className="font-display text-2xl text-kaleo-earth">Hero</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            value={hero.title}
            onChange={(e) => setHero((p) => ({ ...p, title: e.target.value }))}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2"
            placeholder="Hero title"
          />
          <input
            value={hero.subtitle ?? ''}
            onChange={(e) => setHero((p) => ({ ...p, subtitle: e.target.value }))}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2"
            placeholder="Hero subtitle"
          />
          <input
            value={hero.cta_label ?? ''}
            onChange={(e) => setHero((p) => ({ ...p, cta_label: e.target.value }))}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2"
            placeholder="CTA label"
          />
          <input
            value={hero.cta_link ?? ''}
            onChange={(e) => setHero((p) => ({ ...p, cta_link: e.target.value }))}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2"
            placeholder="CTA link"
          />
          <input
            value={hero.background_image_url ?? ''}
            onChange={(e) => setHero((p) => ({ ...p, background_image_url: e.target.value }))}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2 md:col-span-2"
            placeholder="Background image URL"
          />
          <label className="md:col-span-2">
            <input
              type="file"
              accept="image/*"
              disabled={uploadingHero}
              className="sr-only"
              onChange={async (e) => {
                const inputEl = e.currentTarget;
                setUploadingHero(true);
                try {
                  const urls = await uploadMediaFiles(inputEl.files);
                  if (!urls.length) {
                    toast.error('No uploaded image URL returned');
                  } else {
                    setHero((p) => ({ ...p, background_image_url: urls[0] }));
                    toast.success('Hero image uploaded');
                  }
                } catch (err) {
                  toast.error((err as Error).message || 'Hero image upload failed');
                } finally {
                  setUploadingHero(false);
                  inputEl.value = '';
                }
              }}
            />
            <span className={FILE_PICKER_BUTTON}>
              {uploadingHero ? 'Uploading hero image...' : 'Choose hero image'}
            </span>
          </label>
          <p className="md:col-span-2 text-xs text-kaleo-earth/60">
            Select an image file to upload. URL field updates automatically.
          </p>
          {hero.background_image_url ? (
            <div className="md:col-span-2 overflow-hidden rounded-lg border border-kaleo-earth/15">
              <img
                src={toAbsoluteMediaUrl(hero.background_image_url)}
                alt="Hero background preview"
                className="h-40 w-full object-cover"
              />
            </div>
          ) : null}
          {hero.background_image_url ? (
            <button
              type="button"
              onClick={() => setHero((p) => ({ ...p, background_image_url: '' }))}
              className="md:col-span-2 rounded-[9px] border border-red-300 px-4 py-2 text-xs uppercase tracking-wider text-red-700"
            >
              Remove hero image
            </button>
          ) : null}
          <label className="inline-flex items-center gap-2 text-sm text-kaleo-earth">
            <input
              type="checkbox"
              checked={Boolean(hero.publish)}
              onChange={(e) => setHero((p) => ({ ...p, publish: e.target.checked ? 1 : 0 }))}
            />
            Published
          </label>
        </div>
        <button
          type="button"
          onClick={() => void saveHero()}
          className="mt-4 rounded-[9px] bg-kaleo-terracotta px-4 py-2 text-xs uppercase tracking-wider text-white"
        >
          Save hero
        </button>
      </section>

      <section className={PANEL}>
        <h2 className="font-display text-2xl text-kaleo-earth">Promo Banner</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="inline-flex items-center gap-2 text-sm text-kaleo-earth md:col-span-2">
            <input
              type="checkbox"
              checked={Boolean(banner.enabled)}
              onChange={(e) => setBanner((p) => ({ ...p, enabled: e.target.checked ? 1 : 0 }))}
            />
            Enabled
          </label>
          <input
            value={banner.message ?? ''}
            onChange={(e) => setBanner((p) => ({ ...p, message: e.target.value }))}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2 md:col-span-2"
            placeholder="Banner message"
          />
          <input
            value={banner.image_url ?? ''}
            onChange={(e) => setBanner((p) => ({ ...p, image_url: e.target.value }))}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2 md:col-span-2"
            placeholder="Banner image URL"
          />
          <label className="md:col-span-2">
            <input
              type="file"
              accept="image/*"
              disabled={uploadingBannerImage}
              className="sr-only"
              onChange={async (e) => {
                const inputEl = e.currentTarget;
                setUploadingBannerImage(true);
                try {
                  const urls = await uploadMediaFiles(inputEl.files);
                  if (!urls.length) {
                    toast.error('No uploaded image URL returned');
                  } else {
                    setBanner((p) => ({ ...p, image_url: urls[0] }));
                    toast.success('Banner image uploaded');
                  }
                } catch (err) {
                  toast.error((err as Error).message || 'Banner image upload failed');
                } finally {
                  setUploadingBannerImage(false);
                  inputEl.value = '';
                }
              }}
            />
            <span className={FILE_PICKER_BUTTON}>
              {uploadingBannerImage ? 'Uploading banner image...' : 'Choose banner image'}
            </span>
          </label>
          {banner.image_url ? (
            <div className="md:col-span-2 overflow-hidden rounded-lg border border-kaleo-earth/15">
              <img
                src={toAbsoluteMediaUrl(banner.image_url)}
                alt="Promo banner preview"
                className="h-28 w-full object-cover"
              />
            </div>
          ) : null}
          {banner.image_url ? (
            <button
              type="button"
              onClick={() => setBanner((p) => ({ ...p, image_url: '' }))}
              className="rounded-[9px] border border-red-300 px-4 py-2 text-xs uppercase tracking-wider text-red-700 md:col-span-2"
            >
              Remove banner image
            </button>
          ) : null}
          <input
            value={banner.cta_label ?? ''}
            onChange={(e) => setBanner((p) => ({ ...p, cta_label: e.target.value }))}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2"
            placeholder="CTA label"
          />
          <input
            value={banner.cta_link ?? ''}
            onChange={(e) => setBanner((p) => ({ ...p, cta_link: e.target.value }))}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2"
            placeholder="CTA link"
          />
          <input
            type="datetime-local"
            title="Promo banner start date and time"
            value={banner.start_at ?? ''}
            onChange={(e) => setBanner((p) => ({ ...p, start_at: e.target.value }))}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2"
          />
          <input
            type="datetime-local"
            title="Promo banner end date and time"
            value={banner.end_at ?? ''}
            onChange={(e) => setBanner((p) => ({ ...p, end_at: e.target.value }))}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2"
          />
        </div>
        <button
          type="button"
          onClick={() => void saveBanner()}
          className="mt-4 rounded-[9px] bg-kaleo-terracotta px-4 py-2 text-xs uppercase tracking-wider text-white"
        >
          Save promo banner
        </button>
        <button
          type="button"
          onClick={clearBannerForm}
          className="ml-2 mt-4 rounded-[9px] border border-kaleo-earth/20 px-4 py-2 text-xs uppercase tracking-wider text-kaleo-earth"
        >
          Clear fields
        </button>
      </section>

      <section className={PANEL}>
        <h2 className="font-display text-2xl text-kaleo-earth">Testimonials</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <textarea
            value={newTestimonial.quote}
            onChange={(e) => setNewTestimonial((p) => ({ ...p, quote: e.target.value }))}
            title="New testimonial quote"
            className="min-h-[80px] rounded-xl border border-kaleo-earth/20 px-3 py-2 md:col-span-2"
            placeholder="Quote"
          />
          <input
            value={newTestimonial.author_name}
            onChange={(e) => setNewTestimonial((p) => ({ ...p, author_name: e.target.value }))}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2"
            placeholder="Author name"
          />
          <input
            value={newTestimonial.location}
            onChange={(e) => setNewTestimonial((p) => ({ ...p, location: e.target.value }))}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2"
            placeholder="Location"
          />
          <button
            type="button"
            onClick={() => void createTestimonial()}
            className="rounded-[9px] bg-kaleo-earth px-4 py-2 text-xs uppercase tracking-wider text-white md:col-span-2"
          >
            Add testimonial
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {testimonials.map((row) => (
            <div key={row.id} className="rounded-xl border border-kaleo-earth/10 p-3">
              <input
                title="Testimonial author"
                value={row.author_name}
                onChange={(e) =>
                  setTestimonials((prev) => prev.map((t) => (t.id === row.id ? { ...t, author_name: e.target.value } : t)))
                }
                placeholder="Author name"
                className="mb-2 w-full rounded-lg border border-kaleo-earth/20 px-2 py-1"
              />
              <textarea
                title="Testimonial quote"
                value={row.quote}
                onChange={(e) =>
                  setTestimonials((prev) => prev.map((t) => (t.id === row.id ? { ...t, quote: e.target.value } : t)))
                }
                placeholder="Quote"
                className="min-h-[70px] w-full rounded-lg border border-kaleo-earth/20 px-2 py-1"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void updateTestimonial(row)}
                  className="rounded-[9px] bg-kaleo-terracotta px-3 py-2 text-xs uppercase tracking-wider text-white"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => void deleteTestimonial(row.id)}
                  className="rounded-[9px] border border-red-300 px-3 py-2 text-xs uppercase tracking-wider text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!testimonials.length ? <p className="text-sm text-kaleo-earth/60">No testimonials yet.</p> : null}
        </div>
      </section>

      <section className={PANEL}>
        <h2 className="font-display text-2xl text-kaleo-earth">Policies</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          <select
            title="New policy type"
            value={newPolicy.type}
            onChange={(e) => setNewPolicy((p) => ({ ...p, type: e.target.value as PolicyType }))}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2"
          >
            <option value="TERMS">TERMS</option>
            <option value="PRIVACY">PRIVACY</option>
            <option value="CANCELLATION">CANCELLATION</option>
          </select>
          <input
            value={newPolicy.slug}
            onChange={(e) => {
              setNewPolicySlugTouched(true);
              setNewPolicy((p) => ({ ...p, slug: e.target.value }));
            }}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2"
            placeholder="Slug"
          />
          <input
            value={newPolicy.title}
            onChange={(e) =>
              setNewPolicy((p) => {
                const nextTitle = e.target.value;
                return {
                  ...p,
                  title: nextTitle,
                  slug: newPolicySlugTouched ? p.slug : toSlug(nextTitle),
                };
              })
            }
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2"
            placeholder="Title"
          />
          <textarea
            value={newPolicy.body}
            onChange={(e) => setNewPolicy((p) => ({ ...p, body: e.target.value }))}
            className="min-h-[80px] rounded-xl border border-kaleo-earth/20 px-3 py-2 md:col-span-3"
            placeholder="Policy body"
          />
          <button
            type="button"
            onClick={() => void createPolicy()}
            className="rounded-[9px] bg-kaleo-earth px-4 py-2 text-xs uppercase tracking-wider text-white md:col-span-3"
          >
            Add policy
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {policies.map((row) => (
            <div key={row.id} className="rounded-xl border border-kaleo-earth/10 p-3">
              <div className="grid gap-2 md:grid-cols-3">
                <select
                  title="Policy type"
                  value={row.type}
                  onChange={(e) =>
                    setPolicies((prev) => prev.map((p) => (p.id === row.id ? { ...p, type: e.target.value as PolicyType } : p)))
                  }
                  className="rounded-lg border border-kaleo-earth/20 px-2 py-1"
                >
                  <option value="TERMS">TERMS</option>
                  <option value="PRIVACY">PRIVACY</option>
                  <option value="CANCELLATION">CANCELLATION</option>
                </select>
                <input
                  title="Policy slug"
                  value={row.slug}
                  onChange={(e) =>
                    setPolicies((prev) => prev.map((p) => (p.id === row.id ? { ...p, slug: e.target.value } : p)))
                  }
                  placeholder="Slug"
                  className="rounded-lg border border-kaleo-earth/20 px-2 py-1"
                />
                <input
                  title="Policy title"
                  value={row.title}
                  onChange={(e) =>
                    setPolicies((prev) => prev.map((p) => (p.id === row.id ? { ...p, title: e.target.value } : p)))
                  }
                  placeholder="Title"
                  className="rounded-lg border border-kaleo-earth/20 px-2 py-1"
                />
              </div>
              <textarea
                title="Policy body"
                value={row.body}
                onChange={(e) =>
                  setPolicies((prev) => prev.map((p) => (p.id === row.id ? { ...p, body: e.target.value } : p)))
                }
                placeholder="Policy content"
                className="mt-2 min-h-[80px] w-full rounded-lg border border-kaleo-earth/20 px-2 py-1"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void updatePolicy(row)}
                  className="rounded-[9px] bg-kaleo-terracotta px-3 py-2 text-xs uppercase tracking-wider text-white"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => void deletePolicy(row.id)}
                  className="rounded-[9px] border border-red-300 px-3 py-2 text-xs uppercase tracking-wider text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!policies.length ? <p className="text-sm text-kaleo-earth/60">No policies yet.</p> : null}
        </div>
      </section>

      <section className={PANEL}>
        <h2 className="font-display text-2xl text-kaleo-earth">Gallery</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <select
            title="New gallery media type"
            value={newMedia.media_type}
            onChange={(e) => setNewMedia((p) => ({ ...p, media_type: e.target.value as 'IMAGE' | 'VIDEO' }))}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2"
          >
            <option value="IMAGE">IMAGE</option>
            <option value="VIDEO">VIDEO</option>
          </select>
          <input
            value={newMedia.title}
            onChange={(e) => setNewMedia((p) => ({ ...p, title: e.target.value }))}
            className="rounded-xl border border-kaleo-earth/20 px-3 py-2"
            placeholder="Title"
          />
          {newMedia.media_type === 'IMAGE' ? (
            <input
              value={newMedia.src_url}
              onChange={(e) => setNewMedia((p) => ({ ...p, src_url: e.target.value }))}
              className="rounded-xl border border-kaleo-earth/20 px-3 py-2 md:col-span-2"
              placeholder="Image URL"
            />
          ) : (
            <>
              <input
                value={newMedia.src_url}
                onChange={(e) => setNewMedia((p) => ({ ...p, src_url: e.target.value }))}
                className="rounded-xl border border-kaleo-earth/20 px-3 py-2 md:col-span-2"
                placeholder="Uploaded video URL (auto-filled on upload)"
              />
              <input
                value={newMedia.video_embed_url}
                onChange={(e) => setNewMedia((p) => ({ ...p, video_embed_url: e.target.value }))}
                className="rounded-xl border border-kaleo-earth/20 px-3 py-2 md:col-span-2"
                placeholder="Video embed URL (YouTube/Vimeo optional)"
              />
            </>
          )}
          {newMedia.media_type === 'IMAGE' ? (
            <label className="md:col-span-2">
              <input
                type="file"
                accept="image/*"
                disabled={uploadingGalleryImage}
                className="sr-only"
                onChange={async (e) => {
                  const inputEl = e.currentTarget;
                  setUploadingGalleryImage(true);
                  try {
                    const urls = await uploadMediaFiles(inputEl.files);
                    if (!urls.length) {
                      toast.error('No uploaded image URL returned');
                    } else {
                      setNewMedia((p) => ({ ...p, src_url: urls[0] }));
                      toast.success('Gallery image uploaded');
                    }
                  } catch (err) {
                    toast.error((err as Error).message || 'Gallery image upload failed');
                  } finally {
                    setUploadingGalleryImage(false);
                    inputEl.value = '';
                  }
                }}
              />
              <span className={FILE_PICKER_BUTTON}>
                {uploadingGalleryImage ? 'Uploading image...' : 'Choose gallery image'}
              </span>
            </label>
          ) : (
            <label className="md:col-span-2">
              <input
                type="file"
                accept="video/*"
                disabled={uploadingGalleryVideo}
                className="sr-only"
                onChange={async (e) => {
                  const inputEl = e.currentTarget;
                  setUploadingGalleryVideo(true);
                  try {
                    const urls = await uploadMediaFiles(inputEl.files);
                    if (!urls.length) {
                      toast.error('No uploaded video URL returned');
                    } else {
                      setNewMedia((p) => ({ ...p, src_url: urls[0] }));
                      toast.success('Gallery video uploaded');
                    }
                  } catch (err) {
                    toast.error((err as Error).message || 'Gallery video upload failed');
                  } finally {
                    setUploadingGalleryVideo(false);
                    inputEl.value = '';
                  }
                }}
              />
              <span className={FILE_PICKER_BUTTON}>
                {uploadingGalleryVideo ? 'Uploading video...' : 'Choose gallery video'}
              </span>
            </label>
          )}
          {newMedia.media_type === 'IMAGE' && newMedia.src_url ? (
            <div className="md:col-span-2 overflow-hidden rounded-lg border border-kaleo-earth/15">
              <img
                src={toAbsoluteMediaUrl(newMedia.src_url)}
                alt="New gallery image preview"
                className="h-32 w-full object-cover"
              />
            </div>
          ) : null}
          {newMedia.media_type === 'VIDEO' && newMedia.src_url ? (
            <div className="md:col-span-2 overflow-hidden rounded-lg border border-kaleo-earth/15 bg-black">
              <video
                src={toAbsoluteMediaUrl(newMedia.src_url)}
                controls
                className="h-40 w-full object-cover"
              />
            </div>
          ) : null}
          {newMedia.media_type === 'VIDEO' && newMedia.video_embed_url ? (
            <div className="md:col-span-2 overflow-hidden rounded-lg border border-kaleo-earth/15">
              <iframe
                src={newMedia.video_embed_url}
                title="New gallery embed preview"
                className="h-44 w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : null}
          {(newMedia.src_url || newMedia.video_embed_url) ? (
            <button
              type="button"
              onClick={() => setNewMedia((p) => ({ ...p, src_url: '', video_embed_url: '' }))}
              className="rounded-[9px] border border-red-300 px-4 py-2 text-xs uppercase tracking-wider text-red-700 md:col-span-2"
            >
              Remove selected media
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void createMedia()}
            className="rounded-[9px] bg-kaleo-earth px-4 py-2 text-xs uppercase tracking-wider text-white md:col-span-2"
          >
            Add media
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {gallery.map((row) => (
            <div key={row.id} className="rounded-xl border border-kaleo-earth/10 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-kaleo-earth/60">
                {row.media_type} #{row.id}
              </p>
              <input
                title="Gallery media title"
                value={row.title ?? ''}
                onChange={(e) =>
                  setGallery((prev) => prev.map((m) => (m.id === row.id ? { ...m, title: e.target.value } : m)))
                }
                placeholder="Title"
                className="mb-2 w-full rounded-lg border border-kaleo-earth/20 px-2 py-1"
              />
              <input
                title={row.media_type === 'IMAGE' ? 'Gallery image URL' : 'Gallery video embed URL'}
                value={row.media_type === 'IMAGE' ? row.src_url ?? '' : row.video_embed_url ?? ''}
                onChange={(e) =>
                  setGallery((prev) =>
                    prev.map((m) =>
                      m.id === row.id
                        ? m.media_type === 'IMAGE'
                          ? { ...m, src_url: e.target.value }
                          : { ...m, video_embed_url: e.target.value }
                        : m,
                    ),
                  )
                }
                placeholder={row.media_type === 'IMAGE' ? 'Image URL' : 'Video embed URL'}
                className="w-full rounded-lg border border-kaleo-earth/20 px-2 py-1"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void updateMedia(row)}
                  className="rounded-[9px] bg-kaleo-terracotta px-3 py-2 text-xs uppercase tracking-wider text-white"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => void deleteMedia(row.id)}
                  className="rounded-[9px] border border-red-300 px-3 py-2 text-xs uppercase tracking-wider text-red-700"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {!gallery.length ? <p className="text-sm text-kaleo-earth/60">No gallery items yet.</p> : null}
        </div>
      </section>
    </div>
  );
}

