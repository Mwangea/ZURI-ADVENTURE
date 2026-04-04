import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Seo } from '@/components/Seo';
import { pageTitle } from '@/lib/site';
import { apiRequest } from '@/lib/api';
import { InteriorLayout } from '@/layouts/InteriorLayout';

type PolicyDto = {
  id: number;
  type: 'TERMS' | 'PRIVACY' | 'CANCELLATION';
  slug: string;
  title: string;
  body: string;
};

const aliasTypeMap: Record<string, PolicyDto['type']> = {
  'terms-of-service': 'TERMS',
  'privacy-policy': 'PRIVACY',
  'cancellation-policy': 'CANCELLATION',
};

function renderPolicyBody(body: string) {
  const lines = body.split('\n');
  const nodes: React.ReactNode[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraph = () => {
    if (!paragraphBuffer.length) return;
    nodes.push(
      <p key={`p-${nodes.length}`} className="font-body text-sm leading-8 text-kaleo-earth/85 sm:text-base">
        {paragraphBuffer.join(' ')}
      </p>,
    );
    paragraphBuffer = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushParagraph();
      continue;
    }

    if (/^\d+[\.\)]\s+/.test(line)) {
      flushParagraph();
      nodes.push(
        <h3
          key={`h-${nodes.length}`}
          className="pt-3 font-display text-xl font-bold text-kaleo-earth sm:text-2xl"
        >
          {line}
        </h3>,
      );
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraph();
  return nodes.length ? nodes : [
    <p key="empty" className="font-body text-sm leading-8 text-kaleo-earth/85 sm:text-base">
      {body}
    </p>,
  ];
}

const fallbackPolicies: Record<string, { title: string; body: string }> = {
  'privacy-policy': {
    title: 'Privacy Policy',
    body: 'Our privacy policy content is being updated. Please contact us for urgent privacy questions.',
  },
  'terms-of-service': {
    title: 'Terms of Service',
    body: 'Our terms of service content is being updated. Please contact us for urgent terms questions.',
  },
  'cancellation-policy': {
    title: 'Cancellation Policy',
    body: 'Our cancellation policy content is being updated. Please contact us for urgent cancellation questions.',
  },
};

export default function PolicyPage() {
  const location = useLocation();
  const { slug = '' } = useParams();
  const resolvedSlug = slug || location.pathname.replace(/^\//, '');
  const [policy, setPolicy] = useState<PolicyDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await apiRequest<{ policy: PolicyDto }>(`/api/v1/content/policies/${encodeURIComponent(resolvedSlug)}`);
        if (!cancelled) setPolicy(data.policy);
      } catch {
        const aliasType = aliasTypeMap[resolvedSlug];
        if (!aliasType) {
          if (!cancelled) setPolicy(null);
          return;
        }
        try {
          const list = await apiRequest<{ policies: PolicyDto[] }>('/api/v1/content/policies');
          const matched = (list.policies ?? []).find((p) => p.type === aliasType) ?? null;
          if (!cancelled) setPolicy(matched);
        } catch {
          if (!cancelled) setPolicy(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resolvedSlug]);

  const fallback = useMemo(() => fallbackPolicies[resolvedSlug], [resolvedSlug]);
  const title = policy?.title || fallback?.title || 'Policy';
  const body = policy?.body || fallback?.body || 'Policy not found.';
  const notFound = !loading && !policy && !fallback;
  const displayDate = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date()),
    [],
  );
  const policyTypeLabel = policy?.type
    ? policy.type === 'TERMS'
      ? 'Terms'
      : policy.type === 'PRIVACY'
        ? 'Privacy'
        : 'Cancellation'
    : 'Policy';

  return (
    <InteriorLayout>
      <Seo
        title={pageTitle(title)}
        description={body.slice(0, 160)}
        canonicalPath={`/policies/${resolvedSlug}`}
      />
      <section className="relative overflow-hidden bg-gradient-to-b from-kaleo-sand to-[#f4f0e8] px-4 py-10 md:px-8 md:py-14">
        <div className="pointer-events-none absolute -left-20 top-10 h-56 w-56 rounded-full bg-kaleo-terracotta/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-10 h-56 w-56 rounded-full bg-kaleo-earth/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl">
          <div className="mb-4 flex flex-wrap items-center gap-2 font-body text-xs uppercase tracking-[0.15em] text-kaleo-earth/55">
            <Link to="/" className="hover:text-kaleo-terracotta">Home</Link>
            <span aria-hidden> / </span>
            <span>{policyTypeLabel}</span>
          </div>

          <div className="rounded-3xl border border-kaleo-earth/10 bg-white/95 p-6 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.35)] backdrop-blur-sm md:p-10">
            <div className="mb-6 flex flex-col items-start justify-between gap-3 border-b border-kaleo-earth/10 pb-5 sm:flex-row sm:items-center">
              <h1 className="font-display text-2xl leading-tight text-kaleo-earth sm:text-3xl md:text-4xl break-words">
                {title}
              </h1>
              <Link
                to="/"
                className="shrink-0 rounded-full border border-kaleo-earth/20 px-4 py-2 font-body text-xs uppercase tracking-wider text-kaleo-earth transition hover:border-kaleo-terracotta hover:text-kaleo-terracotta"
              >
                Back to home
              </Link>
            </div>
            <p className="mb-6 font-body text-sm text-kaleo-earth/60">Last updated: {displayDate}</p>
            {loading ? (
              <p className="font-body text-sm text-kaleo-earth/60">Loading policy...</p>
            ) : (
              <article className="space-y-4 break-words">
                {renderPolicyBody(body)}
              </article>
            )}
            {notFound ? (
              <p className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                This policy page is not available yet.
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </InteriorLayout>
  );
}
