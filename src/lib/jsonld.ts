import {
  faqConfig,
  footerConfig,
  siteConfig,
  type Package,
} from '@/config';
import { absoluteUrl } from '@/lib/site';

export function travelAgencyJsonLd(): Record<string, unknown> {
  const sameAs = footerConfig.socials.map((s) => s.href).filter(Boolean);
  const tel = footerConfig.contact.find((c) => c.type === 'phone');
  return {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: siteConfig.siteName,
    description: siteConfig.siteDescription,
    url: absoluteUrl('/'),
    ...(tel ? { telephone: tel.value } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    address: {
      '@type': 'PostalAddress',
      addressLocality: footerConfig.address[0] ?? 'Mombasa',
      addressCountry: 'KE',
    },
  };
}

export function webSiteJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.siteName,
    description: siteConfig.siteDescription,
    url: absoluteUrl('/'),
  };
}

export function faqPageJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqConfig.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  };
}

export function packageProductJsonLd(pkg: Package, path: string): Record<string, unknown> {
  const desc = pkg.seoDescription ?? `${pkg.name} — ${pkg.duration} coastal Kenya experience with Zuri Adventures.`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: pkg.name,
    description: desc,
    image: absoluteUrl(pkg.image),
    brand: { '@type': 'Brand', name: siteConfig.siteName },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: pkg.price.replace(/[^\d.]/g, '') || undefined,
      availability: 'https://schema.org/InStock',
      url: absoluteUrl(path),
    },
  };
}

export function touristTripJsonLd(
  item: { title: string; description: string; image: string; seoDescription?: string },
  path: string,
): Record<string, unknown> {
  const desc = item.seoDescription ?? item.description;
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: item.title,
    description: desc,
    image: absoluteUrl(item.image),
    touristType: 'Adventure traveler',
    url: absoluteUrl(path),
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function packageItemListJsonLd(packages: Array<{ slug: string; name: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Tour packages',
    numberOfItems: packages.length,
    itemListElement: packages.map((pkg, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: pkg.name,
      url: absoluteUrl(`/packages/${pkg.slug}`),
    })),
  };
}

export function adventureItemListJsonLd(items: Array<{ slug?: string; id?: string; title: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Coastal adventures',
    numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.title,
      url: absoluteUrl(`/adventures/${item.slug || item.id || ''}`),
    })),
  };
}
