export type ProductColor = { name: string; hex: string };
export type ProductSize = { label: string; inStock: boolean; variantId?: string };
export type ProductVariant = {
  id: string;
  product_id: string;
  label: string;
  sku?: string;
  price?: number;
  stock_quantity?: number;
  sort_order: number;
  active: boolean;
};

export type FashionProduct = {
  id: string;
  merchant_id: string;
  name: string;
  price: number;
  currency: string;
  description?: string;
  image_url?: string;
  images?: string[];
  category_id?: string;
  category_name?: string;
  sku?: string;
  stock_quantity?: number;
  sizes?: ProductSize[];
  colors?: ProductColor[];
  fabric?: string;
  care_instructions?: string;
  delivery_info?: string;
  rating?: number;
  review_count?: number;
  featured?: boolean;
  active?: boolean;
  variants?: ProductVariant[];
  item_details?: Record<string, unknown>;
};

export type Category = {
  id: string;
  merchant_id: string;
  name: string;
  emoji?: string;
  image_url?: string;
  sort_order: number;
  slug: string;
};

export type TailoringService = {
  id: string;
  merchant_id: string;
  name: string;
  description?: string;
  price: number;
  estimated_days: number;
  image_url?: string;
  active: boolean;
  category: string;
};

export type TailoringBooking = {
  id?: string;
  merchant_id: string;
  service_id: string;
  service_name: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  scheduled_at: string;
  urgency: 'standard' | 'express' | 'rush';
  pickup_method: 'pickup' | 'delivery';
  notes?: string;
  image_url?: string;
  amount: number;
  deposit_amount?: number;
  status?: string;
  payment_status?: string;
};

export type CartItem = {
  product: FashionProduct;
  quantity: number;
  size?: string;
  color?: string;
};

export type WardrobeOutfit = {
  id: string;
  user_id: string;
  name: string;
  collection: string;
  items: Array<{ product_id: string; name: string; image_url?: string }>;
  created_at: string;
};

export type CustomerMeasurement = {
  id?: string;
  user_id: string;
  chest?: number;
  shoulders?: number;
  waist?: number;
  neck?: number;
  sleeve?: number;
  leg?: number;
  height?: number;
  recommended_size?: string;
  confidence?: number;
  source: 'manual' | 'ai';
  created_at?: string;
};

export const DEFAULT_CATEGORIES: Omit<Category, 'id' | 'merchant_id'>[] = [
  { name: 'Women', emoji: '✨', sort_order: 1, slug: 'women' },
  { name: 'Men', emoji: '🌿', sort_order: 2, slug: 'men' },
  { name: 'Unisex', emoji: '💫', sort_order: 3, slug: 'unisex' },
  { name: 'Gift sets', emoji: '🎁', sort_order: 4, slug: 'gift-sets' },
  { name: 'Bestsellers', emoji: '⭐', sort_order: 5, slug: 'bestsellers' },
];

export const DEFAULT_TAILORING_SERVICES: Omit<TailoringService, 'id' | 'merchant_id'>[] = [
  { name: 'Clothing Alterations', category: 'alterations', price: 150, estimated_days: 3, active: true, description: 'General clothing alterations and adjustments' },
  { name: 'Shortening Pants', category: 'hemming', price: 80, estimated_days: 2, active: true, description: 'Hem casual pants to your desired length' },
  { name: 'Shortening Formal Pants', category: 'hemming', price: 120, estimated_days: 2, active: true, description: 'Professional hem for formal trousers' },
  { name: 'Shortening Dresses', category: 'hemming', price: 100, estimated_days: 2, active: true, description: 'Dress length adjustment' },
  { name: 'Shortening Shirts', category: 'hemming', price: 70, estimated_days: 2, active: true, description: 'Shirt length adjustment' },
  { name: 'Dress Alterations', category: 'alterations', price: 200, estimated_days: 4, active: true, description: 'Full dress fitting and alterations' },
  { name: 'Skirt Alterations', category: 'alterations', price: 120, estimated_days: 3, active: true, description: 'Skirt waist and length adjustments' },
  { name: 'Shirt Alterations', category: 'alterations', price: 100, estimated_days: 3, active: true, description: 'Shirt fitting and adjustments' },
  { name: 'Jacket Alterations', category: 'alterations', price: 250, estimated_days: 5, active: true, description: 'Jacket fitting, sleeves, and body adjustments' },
  { name: 'Blazer Reduction', category: 'alterations', price: 300, estimated_days: 5, active: true, description: 'Blazer size reduction and reshaping' },
  { name: 'Zip Replacement', category: 'repairs', price: 150, estimated_days: 3, active: true, description: 'Replace broken or worn zips' },
  { name: 'Bag Zip Installation', category: 'repairs', price: 120, estimated_days: 2, active: true, description: 'Install or replace bag zips' },
  { name: 'Pants Zip Installation', category: 'repairs', price: 100, estimated_days: 2, active: true, description: 'Pants zip replacement' },
  { name: 'Jacket Zip Installation', category: 'repairs', price: 180, estimated_days: 3, active: true, description: 'Jacket zip replacement' },
  { name: 'Hemming', category: 'hemming', price: 60, estimated_days: 1, active: true, description: 'Basic hemming service' },
  { name: 'Trouser Adjustments', category: 'alterations', price: 130, estimated_days: 3, active: true, description: 'Waist, seat, and leg adjustments' },
];
