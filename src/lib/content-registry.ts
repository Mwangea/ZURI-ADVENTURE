import { packagesConfig, zigZagGridConfig, type Package, type ZigZagGridItem } from '@/config';

export function getAllPackages(): Package[] {
  return packagesConfig.packages;
}

export function getPackageBySlug(slug: string): Package | undefined {
  return packagesConfig.packages.find((p) => p.slug === slug);
}

export function getAllAdventures(): ZigZagGridItem[] {
  return zigZagGridConfig.items;
}

export function getAdventureBySlug(slug: string): ZigZagGridItem | undefined {
  return zigZagGridConfig.items.find((item) => item.id === slug);
}

export function getAdventureForPackage(packageSlug: string): ZigZagGridItem | undefined {
  return zigZagGridConfig.items.find((item) => item.relatedPackageSlug === packageSlug);
}
