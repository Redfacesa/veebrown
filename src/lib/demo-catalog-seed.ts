/**
 * Starter Pangolin catalog — seeded to Supabase for admin edit + storefront.
 * Images use veebrown.vercel.app public paths (upload real photos in admin anytime).
 */
export type DemoCatalogItem = {
  sku: string;
  name: string;
  price: number;
  description: string;
  categorySlug: string;
  stockQuantity: number;
  featured: boolean;
  fabric?: string;
  careInstructions?: string;
  deliveryInfo?: string;
  rating?: number;
  reviewCount?: number;
  imagePath: string;
  galleryPaths?: string[];
  sizes: Array<{ label: string; inStock: boolean }>;
  colors?: Array<{ name: string; hex: string }>;
};

export const PANGOLIN_DEMO_CATALOG: DemoCatalogItem[] = [
  {
    sku: 'PGN-TS-001',
    name: 'Pangolin Classic T-Shirt',
    price: 349,
    description:
      'Premium cotton tee featuring the iconic Pangolin logo. Soft, breathable, and built for everyday style.',
    categorySlug: 't-shirts',
    stockQuantity: 24,
    featured: true,
    fabric: '100% Premium Cotton',
    careInstructions: 'Machine wash cold. Do not bleach. Tumble dry low.',
    deliveryInfo: '2-5 business days nationwide. Free delivery on orders over R500.',
    rating: 4.8,
    reviewCount: 42,
    imagePath: '/products/tshirt-1.png',
    galleryPaths: ['/products/tshirt-1.png', '/products/tshirt-2.png', '/products/tshirt-ts.png'],
    sizes: [
      { label: 'S', inStock: true },
      { label: 'M', inStock: true },
      { label: 'L', inStock: true },
      { label: 'XL', inStock: true },
      { label: 'XXL', inStock: false },
    ],
    colors: [
      { name: 'Cream', hex: '#f5f0e8' },
      { name: 'Black', hex: '#0a0a0a' },
      { name: 'Wheat', hex: '#c9a962' },
    ],
  },
  {
    sku: 'PGN-TS-002',
    name: 'Pangolin Full Body Tee — Black',
    price: 399,
    description:
      'Statement full-body print tee in classic black. A wardrobe essential with bold Pangolin branding.',
    categorySlug: 't-shirts',
    stockQuantity: 18,
    featured: true,
    fabric: '100% Premium Cotton',
    rating: 4.9,
    reviewCount: 28,
    imagePath: '/products/tshirt-fullbody-black.png',
    galleryPaths: ['/products/tshirt-fullbody-black.png', '/products/tshirt-fullbody.png'],
    sizes: [
      { label: 'S', inStock: true },
      { label: 'M', inStock: true },
      { label: 'L', inStock: true },
      { label: 'XL', inStock: true },
    ],
    colors: [{ name: 'Black', hex: '#0a0a0a' }],
  },
  {
    sku: 'PGN-SH-001',
    name: 'Pangolin Color Block Shirt',
    price: 449,
    description:
      'Vibrant color-block design combining Pangolin signature wheat and cream tones.',
    categorySlug: 'mens-wear',
    stockQuantity: 12,
    featured: true,
    rating: 4.7,
    reviewCount: 15,
    imagePath: '/products/color-shirt.png',
    sizes: [
      { label: 'M', inStock: true },
      { label: 'L', inStock: true },
      { label: 'XL', inStock: true },
    ],
    colors: [
      { name: 'Wheat Mosaic', hex: '#c9a962' },
      { name: 'Cipher', hex: '#6b7c5e' },
    ],
  },
  {
    sku: 'PGN-SET-001',
    name: 'Wheat Mosaic Collection Set',
    price: 1299,
    description:
      'Complete Wheat Mosaic collection — curated pieces for a cohesive seasonal look.',
    categorySlug: 'formal-wear',
    stockQuantity: 8,
    featured: true,
    rating: 5.0,
    reviewCount: 8,
    imagePath: '/collections/wheat-mosaic.jpg',
    sizes: [
      { label: 'S', inStock: true },
      { label: 'M', inStock: true },
      { label: 'L', inStock: false },
    ],
  },
  {
    sku: 'PGN-SET-002',
    name: 'Cipher Collection Set',
    price: 1199,
    description:
      'The Cipher collection — understated elegance with Pangolin craftsmanship.',
    categorySlug: 'formal-wear',
    stockQuantity: 6,
    featured: false,
    rating: 4.6,
    reviewCount: 11,
    imagePath: '/collections/cipher.jpg',
    sizes: [
      { label: 'S', inStock: true },
      { label: 'M', inStock: true },
      { label: 'L', inStock: true },
    ],
  },
  {
    sku: 'PGN-SET-003',
    name: 'Stitchwork Denim Set',
    price: 1499,
    description:
      'Premium stitchwork denim collection. Hand-finished details meet modern silhouettes.',
    categorySlug: 'work-wear',
    stockQuantity: 5,
    featured: true,
    rating: 4.9,
    reviewCount: 6,
    imagePath: '/collections/stitchwork-denim.jpg',
    sizes: [
      { label: 'S', inStock: true },
      { label: 'M', inStock: true },
      { label: 'L', inStock: true },
    ],
  },
];

export function demoImageUrl(siteUrl: string, path: string) {
  const base = siteUrl.replace(/\/$/, '');
  return path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

export function demoItemToItemDetails(item: DemoCatalogItem, siteUrl: string) {
  const images = (item.galleryPaths ?? [item.imagePath]).map((p) => demoImageUrl(siteUrl, p));
  return {
    featured: item.featured,
    sizes: item.sizes,
    colors: item.colors,
    fabric: item.fabric,
    care_instructions: item.careInstructions,
    delivery_info: item.deliveryInfo,
    rating: item.rating,
    review_count: item.reviewCount,
    images,
    demo_catalog: true,
    demo_sku: item.sku,
  };
}
