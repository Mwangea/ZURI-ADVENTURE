import { Helmet } from 'react-helmet-async';
import { siteConfig } from '@/config';
import { absoluteUrl } from '@/lib/site';

type JsonLd = Record<string, unknown>;

type SeoProps = {
  title: string;
  description: string;
  canonicalPath: string;
  noindex?: boolean;
  ogImage?: string;
  /** Shown in og:image:alt and twitter:image:alt for accessibility and some platforms. */
  ogImageAlt?: string;
  ogType?: 'website' | 'article';
  jsonLd?: JsonLd | JsonLd[];
};

function normalizeJsonLd(data: JsonLd | JsonLd[] | undefined): JsonLd[] {
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

const DEFAULT_OG_WIDTH = 1200;
const DEFAULT_OG_HEIGHT = 630;

export function Seo({
  title,
  description,
  canonicalPath,
  noindex,
  ogImage,
  ogImageAlt,
  ogType = 'website',
  jsonLd,
}: SeoProps) {
  const canonical = absoluteUrl(canonicalPath);
  const imageUrl = ogImage ? absoluteUrl(ogImage) : absoluteUrl('/hero-bg.jpg');
  const imageAlt = ogImageAlt ?? `${siteConfig.siteName} — ${title}`.slice(0, 120);
  const robots = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
  const payloads = normalizeJsonLd(jsonLd);

  return (
    <Helmet prioritizeSeoTags>
      <html lang={siteConfig.language} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={robots} />

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={imageUrl} />
      <meta property="og:image:width" content={String(DEFAULT_OG_WIDTH)} />
      <meta property="og:image:height" content={String(DEFAULT_OG_HEIGHT)} />
      <meta property="og:image:alt" content={imageAlt} />
      <meta property="og:site_name" content={siteConfig.siteName} />
      <meta property="og:locale" content="en_KE" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageUrl} />
      <meta name="twitter:image:alt" content={imageAlt} />

      {payloads.map((obj, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(obj) }}
        />
      ))}
    </Helmet>
  );
}
