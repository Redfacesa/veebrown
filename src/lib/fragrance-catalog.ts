import type { FashionProduct } from './types';

/** Canonical product IDs from RedFace Pay catalog. */
export const FRAGRANCE_PRODUCT_IDS = {
  patron: '49034952-c930-4598-a3aa-9af47b52a5bb',
  femmeDuPatron: '2608e073-4fad-4d0a-b1ec-a887d46aba7e',
  leBaron: '8d4319e7-df5b-4c8e-bcdf-296f5afbe4bd',
  madame: '55382323-2934-48c5-a5c2-dc3d8fb20e3d',
  laPatronne: 'e4f27237-1855-42e0-b956-066f8f172b77',
} as const;

/** Copy synced from RedFace Pay merchant product listings. */
export const FRAGRANCE_COPY = {
  patron: {
    title: 'Patron',
    eyebrow: 'Signature · For him',
    body: '50ml Patron Eau de Parfum for Men features a rich, woody, spicy scent. This combination creates a unique and captivating fragrance. Perfect for men who appreciate woody fragrances.',
  },
  femmeDuPatron: {
    title: 'Femme du Patron',
    eyebrow: 'Signature · For her',
    body: '50ml Femme du Patron is a classic floral-gourmand fragrance for the elegant, ambitious woman.',
  },
  leBaron: {
    title: 'Le Baron',
    eyebrow: 'For him',
    body: '50ml Le Baron is an aromatic-spicy fragrance that blends fresh, floral, and warm elements for the confident man.',
  },
} as const;

function signatureRank(name: string): number {
  const n = name.trim().toLowerCase();
  if (n === 'patron') return 0;
  if (n === 'femme du patron') return 1;
  return 99;
}

export function isSignatureFragrance(name: string): boolean {
  return signatureRank(name) < 99;
}

/** Patron and Femme du Patron first, then alphabetical. */
export function sortSignatureFragrancesFirst(products: FashionProduct[]): FashionProduct[] {
  return [...products].sort((a, b) => {
    const rank = signatureRank(a.name) - signatureRank(b.name);
    if (rank !== 0) return rank;
    return a.name.localeCompare(b.name);
  });
}
