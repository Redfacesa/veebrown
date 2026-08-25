import type { FashionProduct, Category, TailoringService, ProductVariant } from './types';
import { DEFAULT_TAILORING_SERVICES } from './types';
import { DEMO_PRODUCTS } from './demo-products';
import { PANGOLIN_MERCHANT_ID, getSupabase } from './supabase';

function parseItemDetails(details: Record<string, unknown> | null | undefined) {
  if (!details || typeof details !== 'object') return {};
  return details;
}

function isFeatured(details: Record<string, unknown>): boolean {
  const raw = details.featured;
  if (raw === true || raw === 1) return true;
  if (typeof raw === 'string') {
    const v = raw.trim().toLowerCase();
    return v === 'true' || v === '1' || v === 'yes';
  }
  return false;
}

function variantsToSizes(variants?: ProductVariant[]): FashionProduct['sizes'] {
  if (!variants?.length) return undefined;
  return variants.map((v) => ({
    label: v.label,
    inStock: v.stock_quantity == null || v.stock_quantity > 0,
    variantId: v.id,
  }));
}

function mapProductRow(
  row: Record<string, unknown>,
  categoryName?: string,
  variants?: ProductVariant[],
): FashionProduct {
  const details = parseItemDetails(row.item_details as Record<string, unknown>);
  const variantList = variants?.length ? variants : undefined;
  const sizesFromVariants = variantsToSizes(variantList);
  return {
    id: String(row.id),
    merchant_id: String(row.merchant_id),
    name: String(row.name),
    price: Number(row.price ?? 0),
    currency: String(row.currency ?? 'ZAR'),
    description: row.description ? String(row.description) : undefined,
    image_url: row.image_url ? String(row.image_url) : undefined,
    images: Array.isArray(details.images) ? (details.images as string[]) : undefined,
    category_id: row.category_id ? String(row.category_id) : undefined,
    category_name: categoryName ?? (row.category_name ? String(row.category_name) : undefined),
    sku: row.sku ? String(row.sku) : undefined,
    stock_quantity: row.stock_quantity != null ? Number(row.stock_quantity) : undefined,
    sizes: sizesFromVariants ?? (Array.isArray(details.sizes) ? (details.sizes as FashionProduct['sizes']) : undefined),
    colors: Array.isArray(details.colors) ? (details.colors as FashionProduct['colors']) : undefined,
    fabric: details.fabric ? String(details.fabric) : undefined,
    care_instructions: details.care_instructions ? String(details.care_instructions) : undefined,
    delivery_info: details.delivery_info ? String(details.delivery_info) : undefined,
    rating: details.rating != null ? Number(details.rating) : undefined,
    review_count: details.review_count != null ? Number(details.review_count) : undefined,
    featured: isFeatured(details),
    active: true,
    variants: variantList,
    item_details: details,
  };
}

function mapRpcVariant(v: Record<string, unknown>): ProductVariant {
  return {
    id: String(v.id),
    product_id: '',
    label: String(v.label),
    price: v.price != null ? Number(v.price) : undefined,
    stock_quantity: v.stock_quantity != null ? Number(v.stock_quantity) : undefined,
    sort_order: Number(v.sort_order ?? 0),
    active: true,
  };
}

function mapRpcProduct(row: Record<string, unknown>): FashionProduct {
  const rawVariants = Array.isArray(row.variants) ? (row.variants as Array<Record<string, unknown>>) : [];
  const variants = rawVariants.map((v) => mapRpcVariant(v));
  return mapProductRow(row, row.category_name ? String(row.category_name) : undefined, variants);
}

function demoFallback(opts?: { featured?: boolean; limit?: number }): FashionProduct[] {
  let demo = [...DEMO_PRODUCTS];
  if (opts?.featured) demo = demo.filter((p) => p.featured);
  if (opts?.limit) demo = demo.slice(0, opts.limit);
  return demo;
}

type StorefrontPayload = {
  ok?: boolean;
  categories?: Array<Record<string, unknown>>;
  products?: Array<Record<string, unknown>>;
};

async function loadStorefrontCatalog(opts?: {
  merchantId?: string;
  categoryId?: string;
  featured?: boolean;
  limit?: number;
}): Promise<{ categories: Category[]; products: FashionProduct[] } | null> {
  const merchantId = opts?.merchantId ?? PANGOLIN_MERCHANT_ID;
  const supabase = getSupabase();
  if (!merchantId || !supabase) return null;

  const { data, error } = await supabase.rpc('pangolin_storefront_catalog', {
    p_merchant_id: merchantId,
    p_category_id: opts?.categoryId ?? null,
    p_featured_only: Boolean(opts?.featured),
    p_limit: opts?.limit ?? 48,
  });

  if (error || !data || !(data as StorefrontPayload).ok) return null;

  const payload = data as StorefrontPayload;
  const categories = (payload.categories ?? []).map((c) => ({
    id: String(c.id),
    merchant_id: String(c.merchant_id),
    name: String(c.name),
    emoji: c.emoji ? String(c.emoji) : undefined,
    image_url: c.image_url ? String(c.image_url) : undefined,
    sort_order: Number(c.sort_order ?? 0),
    slug: c.slug ? String(c.slug) : String(c.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  }));

  const products = (payload.products ?? []).map((p) => mapRpcProduct(p));
  return { categories, products };
}

export async function fetchCategories(merchantId = PANGOLIN_MERCHANT_ID): Promise<Category[]> {
  const catalog = await loadStorefrontCatalog({ merchantId, limit: 1 });
  if (catalog?.categories.length) return catalog.categories;

  const supabase = getSupabase();
  if (!merchantId || !supabase) return [];
  const { data } = await supabase
    .from('product_categories')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('sort_order');
  return (data ?? []).map((r) => ({
    id: String(r.id),
    merchant_id: String(r.merchant_id),
    name: String(r.name),
    emoji: r.emoji ? String(r.emoji) : undefined,
    image_url: r.image_url ? String(r.image_url) : undefined,
    sort_order: Number(r.sort_order ?? 0),
    slug: r.slug ? String(r.slug) : String(r.name).toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  }));
}

export async function fetchProducts(opts?: {
  merchantId?: string;
  categoryId?: string;
  featured?: boolean;
  limit?: number;
  includeInactive?: boolean;
}): Promise<FashionProduct[]> {
  const merchantId = opts?.merchantId ?? PANGOLIN_MERCHANT_ID;

  if (!opts?.includeInactive) {
    const catalog = await loadStorefrontCatalog({
      merchantId,
      categoryId: opts?.categoryId,
      featured: opts?.featured,
      limit: opts?.limit,
    });
    if (catalog?.products.length) return catalog.products;

    const supabase = getSupabase();
    if (merchantId && supabase) {
      let q = supabase
        .from('products_public')
        .select('*')
        .eq('merchant_id', merchantId)
        .eq('listing_type', 'product');
      if (opts?.categoryId) q = q.eq('category_id', opts.categoryId);
      if (opts?.limit) q = q.limit(opts.limit);
      const { data } = await q.order('created_at', { ascending: false });
      const products = (data ?? []).map((r) => mapProductRow(r as Record<string, unknown>));
      if (opts?.featured) {
        const featured = products.filter((p) => p.featured);
        if (featured.length) return featured;
      } else if (products.length) {
        return products;
      }
    }
  }

  const supabase = getSupabase();
  if (!merchantId || !supabase) return demoFallback(opts);

  let q = supabase
    .from('products')
    .select('*, product_categories(name), product_variants(id, product_id, label, sku, price, stock_quantity, sort_order, active)')
    .eq('merchant_id', merchantId)
    .eq('listing_type', 'product');

  if (!opts?.includeInactive) q = q.eq('active', true);
  if (opts?.categoryId) q = q.eq('category_id', opts.categoryId);
  if (opts?.limit) q = q.limit(opts.limit);

  const { data } = await q.order('created_at', { ascending: false });
  const products = (data ?? []).map((r) => {
    const cat = r.product_categories as { name?: string } | null;
    const rawVariants = (r.product_variants ?? []) as Array<Record<string, unknown>>;
    const variants: ProductVariant[] = rawVariants
      .filter((v) => v.active !== false)
      .map((v) => ({
        id: String(v.id),
        product_id: String(v.product_id),
        label: String(v.label),
        sku: v.sku ? String(v.sku) : undefined,
        price: v.price != null ? Number(v.price) : undefined,
        stock_quantity: v.stock_quantity != null ? Number(v.stock_quantity) : undefined,
        sort_order: Number(v.sort_order ?? 0),
        active: v.active !== false,
      }))
      .sort((a, b) => a.sort_order - b.sort_order);
    return mapProductRow(r as Record<string, unknown>, cat?.name, variants);
  });

  if (opts?.featured) {
    const featured = products.filter((p) => p.featured);
    return featured.length ? featured : products;
  }
  return products.length ? products : demoFallback(opts);
}

export async function fetchProduct(id: string): Promise<FashionProduct | null> {
  const demo = DEMO_PRODUCTS.find((p) => p.id === id);
  const supabase = getSupabase();
  if (!supabase) return demo ?? null;

  const { data } = await supabase.from('products_public').select('*').eq('id', id).maybeSingle();
  if (data) {
    return mapProductRow(data as Record<string, unknown>);
  }

  const { data: adminRow } = await supabase
    .from('products')
    .select('*, product_categories(name), product_variants(id, product_id, label, sku, price, stock_quantity, sort_order, active)')
    .eq('id', id)
    .maybeSingle();
  if (!adminRow) return demo ?? null;

  const cat = adminRow.product_categories as { name?: string } | null;
  const rawVariants = (adminRow.product_variants ?? []) as Array<Record<string, unknown>>;
  const variants: ProductVariant[] = rawVariants
    .filter((v) => v.active !== false)
    .map((v) => ({
      id: String(v.id),
      product_id: String(v.product_id),
      label: String(v.label),
      sku: v.sku ? String(v.sku) : undefined,
      price: v.price != null ? Number(v.price) : undefined,
      stock_quantity: v.stock_quantity != null ? Number(v.stock_quantity) : undefined,
      sort_order: Number(v.sort_order ?? 0),
      active: v.active !== false,
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
  return mapProductRow(adminRow as Record<string, unknown>, cat?.name, variants);
}

export async function fetchTailoringServices(merchantId = PANGOLIN_MERCHANT_ID): Promise<TailoringService[]> {
  const supabase = getSupabase();
  if (!merchantId || !supabase) {
    return DEFAULT_TAILORING_SERVICES.map((s, i) => ({
      ...s,
      id: `default-${i}`,
      merchant_id: merchantId || '',
    }));
  }

  const { data } = await supabase
    .from('pangolin_tailoring_services')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('active', true)
    .order('sort_order');

  if (!data?.length) {
    return DEFAULT_TAILORING_SERVICES.map((s, i) => ({
      ...s,
      id: `default-${i}`,
      merchant_id: merchantId,
    }));
  }

  return data.map((r) => ({
    id: String(r.id),
    merchant_id: String(r.merchant_id),
    name: String(r.name),
    description: r.description ? String(r.description) : undefined,
    price: Number(r.price ?? 0),
    estimated_days: Number(r.estimated_days ?? 3),
    image_url: r.image_url ? String(r.image_url) : undefined,
    active: r.active !== false,
    category: String(r.category ?? 'alterations'),
  }));
}

export async function createTailoringBooking(booking: {
  merchant_id: string;
  service_id: string;
  service_name: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  scheduled_at: string;
  urgency: string;
  pickup_method: string;
  notes?: string;
  amount: number;
  payment_method?: string;
  payment_status?: string;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase
    .from('merchant_appointments')
    .insert({
      merchant_id: booking.merchant_id,
      service_name: booking.service_name,
      customer_name: booking.customer_name,
      customer_email: booking.customer_email,
      customer_phone: booking.customer_phone,
      scheduled_at: booking.scheduled_at,
      amount: booking.amount,
      currency: 'ZAR',
      notes: JSON.stringify({
        service_id: booking.service_id,
        urgency: booking.urgency,
        pickup_method: booking.pickup_method,
        notes: booking.notes,
        payment_method: booking.payment_method ?? 'card',
        channel: 'pangolin_tailoring_pos',
      }),
      payment_status: booking.payment_status ?? 'unpaid',
      status: 'pending',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Multi-service tailoring POS — one appointment via public RPC. */
export async function createTailoringPosOrder(input: {
  merchant_id: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  scheduled_at: string;
  urgency: string;
  pickup_method: string;
  notes?: string;
  amount: number;
  payment_method: 'card' | 'cash' | 'qr' | 'nfc' | 'link';
  items: Array<{ service_id: string; service_name: string; price: number; quantity: number }>;
}) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const serviceLabel = input.items
    .map((i) => (i.quantity > 1 ? `${i.service_name} x${i.quantity}` : i.service_name))
    .join(', ');

  const notesPayload = {
    items: input.items,
    urgency: input.urgency,
    pickup_method: input.pickup_method,
    customer_notes: input.notes,
    payment_method: input.payment_method,
    channel: 'pangolin_tailoring_pos',
  };

  const { data, error } = await supabase.rpc('pangolin_submit_tailoring_order', {
    p_merchant_id: input.merchant_id,
    p_customer_name: input.customer_name,
    p_customer_email: input.customer_email ?? '',
    p_customer_phone: input.customer_phone ?? null,
    p_scheduled_at: input.scheduled_at,
    p_amount: input.amount,
    p_service_name: serviceLabel.slice(0, 120) || 'Tailoring services',
    p_notes: notesPayload,
    p_payment_method: input.payment_method,
  });

  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  const id = String(row?.appointment_id ?? row?.id ?? '');
  const reference = String(row?.booking_reference ?? id.slice(0, 8).toUpperCase());
  return { id, reference };
}

export function fmtZar(amount: number) {
  return new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);
}
