import { useCallback, useState } from 'react';
import { Check, Copy, Facebook, Share2 } from 'lucide-react';
import { WhatsAppIcon } from '@/components/icons/WhatsAppIcon';
import { XLogoIcon } from '@/components/icons/XLogoIcon';
import { siteConfig } from '@/config';

type TripShareBarProps = {
  /** Path only, e.g. `/packages/coastal-escape` */
  path: string;
  /** Trip title shown in share text */
  title: string;
};

/**
 * Copy link, WhatsApp, and optional native share for package/adventure detail pages.
 */
export function TripShareBar({ path, title }: TripShareBarProps) {
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);

  const fullUrl =
    typeof window !== 'undefined' ? `${window.location.origin}${path.startsWith('/') ? '' : '/'}${path}` : path;

  const shareLine = `${title} — ${siteConfig.siteName}\n${fullUrl}`;

  const copyLink = useCallback(async () => {
    setShareError(false);
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setShareError(true);
      window.setTimeout(() => setShareError(false), 3000);
    }
  }, [fullUrl]);

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(shareLine)}`;
  const facebookHref = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`;
  const xHref = `https://x.com/intent/tweet?text=${encodeURIComponent(`${title} — ${siteConfig.siteName}`)}&url=${encodeURIComponent(fullUrl)}`;

  const tryNativeShare = useCallback(async () => {
    if (!navigator.share) return;
    setShareError(false);
    try {
      await navigator.share({
        title: `${title} — ${siteConfig.siteName}`,
        text: title,
        url: fullUrl,
      });
    } catch (e) {
      if ((e as Error).name === 'AbortError') return;
      setShareError(true);
      window.setTimeout(() => setShareError(false), 3000);
    }
  }, [fullUrl, title]);

  const btnBase =
    'inline-flex items-center justify-center gap-2 rounded-full border bg-white px-4 py-2.5 font-body text-xs uppercase tracking-wider transition-colors sm:text-sm';

  return (
    <section className="mt-8 rounded-2xl border border-kaleo-earth/10 bg-kaleo-sand/30 p-4 sm:p-5" aria-labelledby="trip-share-heading">
      <h2 id="trip-share-heading" className="font-body text-xs uppercase tracking-[0.2em] text-kaleo-earth/60">
        Share this trip
      </h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copyLink}
          className={`${btnBase} border-[#6B7280] text-[#6B7280] hover:bg-[#6B7280]/10`}
        >
          {copied ? (
            <Check className="h-4 w-4 text-[#16A34A]" strokeWidth={2.25} aria-hidden />
          ) : (
            <Copy className="h-4 w-4 text-[#6B7280]" strokeWidth={2} aria-hidden />
          )}
          {copied ? 'Link copied' : 'Copy link'}
        </button>
        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnBase} border-[rgba(37,211,102,0.45)] text-[#25D366] hover:bg-[#25D366]/10`}
        >
          <WhatsAppIcon className="h-4 w-4 shrink-0" />
          WhatsApp
        </a>
        <a
          href={facebookHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnBase} border-[rgba(24,119,242,0.45)] text-[#1877F2] hover:bg-[#1877F2]/10`}
        >
          <Facebook className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          Facebook
        </a>
        <a
          href={xHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnBase} border-[rgba(0,0,0,0.22)] text-[#000000] hover:bg-neutral-100`}
        >
          <XLogoIcon className="h-4 w-4 shrink-0" />
          Post on X
        </a>
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
          <button
            type="button"
            onClick={tryNativeShare}
            className={`${btnBase} border-kaleo-terracotta/40 text-kaleo-terracotta hover:bg-kaleo-terracotta/10`}
          >
            <Share2 className="h-4 w-4 text-kaleo-terracotta" strokeWidth={2} aria-hidden />
            Share…
          </button>
        ) : null}
      </div>
      {shareError ? (
        <p className="mt-2 font-body text-xs text-red-600" role="status">
          Could not share from this browser. Copy the link instead.
        </p>
      ) : null}
    </section>
  );
}
