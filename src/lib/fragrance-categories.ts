import type { Category } from './types';

/** Legacy Pangolin / clothing labels — never show on the fragrance storefront. */
const LEGACY_CLOTHING_CATEGORY_NAMES = new Set([
  'kids',
  'shoes',
  'accessories',
  'jackets',
  'dresses',
  'tailoring',
  'bags',
  'suits',
]);

const DISPLAY_NAME: Record<string, { name: string; emoji: string; slug: string }> = {
  men: { name: 'For Him', emoji: '🌿', slug: 'for-him' },
  women: { name: 'For Her', emoji: '✨', slug: 'for-her' },
  'for him': { name: 'For Him', emoji: '🌿', slug: 'for-him' },
  'for her': { name: 'For Her', emoji: '✨', slug: 'for-her' },
  unisex: { name: 'Unisex', emoji: '💫', slug: 'unisex' },
  'gift sets': { name: 'Gift sets', emoji: '🎁', slug: 'gift-sets' },
  bestsellers: { name: 'Bestsellers', emoji: '⭐', slug: 'bestsellers' },
};

export const FRAGRANCE_FALLBACK_CATEGORIES: Omit<Category, 'id' | 'merchant_id'>[] = [
  { name: 'For Her', emoji: '✨', sort_order: 1, slug: 'for-her' },
  { name: 'For Him', emoji: '🌿', sort_order: 2, slug: 'for-him' },
];

export function normalizeFragranceCategory(cat: Category): Category | null {
  const key = cat.name.trim().toLowerCase();
  if (LEGACY_CLOTHING_CATEGORY_NAMES.has(key)) return null;

  const mapped = DISPLAY_NAME[key];
  if (mapped) {
    return {
      ...cat,
      name: mapped.name,
      emoji: mapped.emoji,
      slug: cat.slug ?? mapped.slug,
    };
  }

  return cat;
}

export function legacyCategorySlug(slug: string | null | undefined): string | null | undefined {
  if (!slug) return slug;
  const map: Record<string, string> = {
    men: 'for-him',
    women: 'for-her',
  };
  return map[slug] ?? slug;
}

export function filterFragranceCategories(categories: Category[]): Category[] {
  const seen = new Set<string>();
  const out: Category[] = [];

  for (const raw of categories) {
    const cat = normalizeFragranceCategory(raw);
    if (!cat) continue;
    const slug = cat.slug ?? cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    if (seen.has(slug)) continue;
    seen.add(slug);
    out.push({ ...cat, slug });
  }

  return out.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
}
