import type { FashionProduct, ProductColor, ProductSize, ProductVariant } from './types';
import { requireAdminAuth } from './admin-auth';
import { getSupabase } from './supabase';
import { uploadProductImages } from './storage';

export type VariantInput = {
  id?: string;
  label: string;
  stockQuantity?: number | null;
  price?: number | null;
};

export type ProductInput = {
  merchantId: string;
  name: string;
  price: number;
  description?: string;
  categoryId?: string;
  stockQuantity?: number | null;
  featured?: boolean;
  sizes?: string;
  colors?: string;
  fabric?: string;
  rating?: number;
  reviewCount?: number;
  imageFile?: File | null;
  imageFiles?: File[];
  existingImages?: string[];
  variants?: VariantInput[];
};

function parseColors(raw?: string): ProductColor[] | undefined {
  if (!raw?.trim()) return undefined;
  return raw.split(',').map((part) => {
    const trimmed = part.trim();
    const [name, hex] = trimmed.split(':').map((s) => s.trim());
    const safeHex = hex?.startsWith('#') ? hex : '#888888';
    return { name: name || trimmed, hex: safeHex };
  }).filter((c) => c.name);
}

function parseSizesFromText(raw?: string): ProductSize[] | undefined {
  if (!raw?.trim()) return undefined;
  return raw.split(',').map((s) => s.trim()).filter(Boolean).map((label) => ({ label, inStock: true }));
}

function buildItemDetails(input: ProductInput, existing?: Record<string, unknown>, imageUrls?: string[]) {
  const details: Record<string, unknown> = { ...(existing ?? {}) };
  if (input.featured != null) details.featured = input.featured;
  const colors = parseColors(input.colors);
  if (colors) details.colors = colors;
  if (input.fabric?.trim()) details.fabric = input.fabric.trim();
  if (input.rating != null && Number.isFinite(input.rating)) details.rating = input.rating;
  if (input.reviewCount != null && Number.isFinite(input.reviewCount)) details.review_count = input.reviewCount;
  if (imageUrls?.length) details.images = imageUrls;
  else if (input.existingImages?.length) details.images = input.existingImages;
  return details;
}

async function syncProductVariants(productId: string, basePrice: number, variants?: VariantInput[]) {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');
  if (!variants) return;

  const { data: existing, error: loadErr } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', productId);
  if (loadErr) throw loadErr;

  const keepIds = variants.map((v) => v.id).filter(Boolean) as string[];
  const toDelete = (existing ?? [])
    .map((r) => String(r.id))
    .filter((id) => !keepIds.includes(id));

  if (toDelete.length) {
    const { error } = await supabase.from('product_variants').delete().in('id', toDelete);
    if (error) throw error;
  }

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const row = {
      product_id: productId,
      label: v.label.trim(),
      price: v.price ?? basePrice,
      stock_quantity: v.stockQuantity ?? null,
      sort_order: i,
      active: true,
    };
    if (v.id) {
      const { error } = await supabase.from('product_variants').update(row).eq('id', v.id);
      if (error) throw error;
    } else if (v.label.trim()) {
      const { error } = await supabase.from('product_variants').insert(row);
      if (error) throw error;
    }
  }
}

async function resolveImageUrls(productId: string, input: ProductInput, existingDetails?: Record<string, unknown>) {
  const kept = [...(input.existingImages ?? [])];
  const uploads = [...(input.imageFiles ?? [])];
  if (input.imageFile) uploads.unshift(input.imageFile);

  if (uploads.length) {
    const urls = await uploadProductImages(productId, uploads);
    kept.push(...urls);
  }

  const fallback = Array.isArray(existingDetails?.images)
    ? (existingDetails!.images as string[])
    : [];
  const all = kept.length ? kept : fallback;
  return all;
}

export async function fetchProductVariants(productId: string): Promise<ProductVariant[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from('product_variants')
    .select('id, product_id, label, sku, price, stock_quantity, sort_order, active')
    .eq('product_id', productId)
    .eq('active', true)
    .order('sort_order');
  return (data ?? []).map((r) => ({
    id: String(r.id),
    product_id: String(r.product_id),
    label: String(r.label),
    sku: r.sku ? String(r.sku) : undefined,
    price: r.price != null ? Number(r.price) : undefined,
    stock_quantity: r.stock_quantity != null ? Number(r.stock_quantity) : undefined,
    sort_order: Number(r.sort_order ?? 0),
    active: r.active !== false,
  }));
}

export async function createMerchantProduct(input: ProductInput): Promise<string> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const trackInventory = input.stockQuantity != null && input.stockQuantity >= 0;
  const itemDetails = buildItemDetails(input);

  const { data, error } = await supabase
    .from('products')
    .insert({
      merchant_id: input.merchantId,
      name: input.name.trim(),
      price: input.price,
      currency: 'ZAR',
      active: true,
      listing_type: 'product',
      billing_type: 'one_time',
      description: input.description?.trim() || null,
      category_id: input.categoryId || null,
      stock_quantity: input.stockQuantity ?? null,
      track_inventory: trackInventory,
      item_details: itemDetails,
      marketplace_category: 'Beauty',
      item_category: 'Fragrance',
    })
    .select('id')
    .single();

  if (error) throw error;
  const id = String(data.id);

  const imageUrls = await resolveImageUrls(id, input);
  if (imageUrls.length) {
    const details = buildItemDetails(input, itemDetails, imageUrls);
    const { error: imgErr } = await supabase
      .from('products')
      .update({ image_url: imageUrls[0], item_details: details })
      .eq('id', id);
    if (imgErr) throw imgErr;
  }

  const variants = input.variants?.length
    ? input.variants
    : parseSizesFromText(input.sizes)?.map((s) => ({
        label: s.label,
        stockQuantity: input.stockQuantity ?? null,
      }));
  if (variants?.length) {
    await syncProductVariants(id, input.price, variants);
  }

  return id;
}

export async function updateMerchantProduct(
  productId: string,
  input: Partial<ProductInput> & { active?: boolean },
  existingDetails?: Record<string, unknown>,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');

  const patch: Record<string, unknown> = {};
  if (input.name != null) patch.name = input.name.trim();
  if (input.price != null) patch.price = input.price;
  if (input.description != null) patch.description = input.description.trim() || null;
  if (input.categoryId !== undefined) patch.category_id = input.categoryId || null;
  if (input.stockQuantity !== undefined) {
    patch.stock_quantity = input.stockQuantity;
    patch.track_inventory = input.stockQuantity != null;
  }
  if (input.active != null) patch.active = input.active;

  const imageUrls = await resolveImageUrls(productId, input as ProductInput, existingDetails);
  const details = buildItemDetails(
    {
      merchantId: input.merchantId ?? '',
      name: input.name ?? '',
      price: input.price ?? 0,
      featured: input.featured,
      colors: input.colors,
      fabric: input.fabric,
      rating: input.rating,
      reviewCount: input.reviewCount,
      existingImages: imageUrls,
    },
    existingDetails,
    imageUrls.length ? imageUrls : undefined,
  );
  patch.item_details = details;
  if (imageUrls.length) patch.image_url = imageUrls[0];

  const { error } = await supabase.from('products').update(patch).eq('id', productId);
  if (error) throw error;

  const basePrice = input.price ?? 0;
  if (input.variants) {
    await syncProductVariants(productId, basePrice, input.variants);
  } else if (input.sizes !== undefined) {
    const fromText = parseSizesFromText(input.sizes)?.map((s) => ({
      label: s.label,
      stockQuantity: input.stockQuantity ?? null,
    }));
    await syncProductVariants(productId, basePrice, fromText ?? []);
  }
}

function throwAdminError(error: { message?: string; code?: string; details?: string; hint?: string }, fallback: string): never {
  const parts = [error.message, error.details, error.hint].filter(Boolean);
  throw new Error(parts.join(' — ') || fallback);
}

function authDeniedMessage(action: string): string {
  return `Could not ${action}. Sign in with the RedFace Pay merchant account (redfacesa@gmail.com) via password or SSO, then try again.`;
}

/**
 * Remove a product from the catalog.
 * Active products are archived (active=false) so order/sale history stays intact.
 * Already-archived products are hard-deleted when the DB allows it.
 */
export async function deleteMerchantProduct(
  productId: string,
  opts?: { currentlyActive?: boolean; merchantId?: string },
): Promise<'archived' | 'deleted'> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');
  await requireAdminAuth();

  const currentlyActive = opts?.currentlyActive !== false;
  let q = supabase.from('products').select('id, active, merchant_id').eq('id', productId);
  if (opts?.merchantId) q = q.eq('merchant_id', opts.merchantId);
  const { data: existing, error: loadErr } = await q.maybeSingle();
  if (loadErr) throwAdminError(loadErr, 'Could not load product');
  if (!existing) throw new Error('Product not found (or you do not have access).');

  if (currentlyActive || existing.active !== false) {
    let upd = supabase
      .from('products')
      .update({ active: false })
      .eq('id', productId)
      .select('id, active');
    if (opts?.merchantId) upd = upd.eq('merchant_id', opts.merchantId);
    const { data: archived, error } = await upd.maybeSingle();
    if (error) throwAdminError(error, 'Could not remove product');
    if (!archived || archived.active !== false) {
      throw new Error(authDeniedMessage('remove this product'));
    }
    return 'archived';
  }

  // Clear variants first (CASCADE exists, but explicit delete avoids opaque RLS/FK errors).
  const { error: variantErr } = await supabase.from('product_variants').delete().eq('product_id', productId);
  if (variantErr) throwAdminError(variantErr, 'Could not remove product variants');

  let del = supabase.from('products').delete().eq('id', productId).select('id');
  if (opts?.merchantId) del = del.eq('merchant_id', opts.merchantId);
  const { data: removed, error } = await del.maybeSingle();
  if (error) {
    const msg = error.message || '';
    if (/foreign key|restrict|violat/i.test(msg) || error.code === '23503') {
      throw new Error(
        'Removed from storefront, but could not permanently erase — it appears on past orders. It stays archived.',
      );
    }
    throwAdminError(error, 'Could not delete product');
  }
  if (!removed) throw new Error(authDeniedMessage('permanently delete this product'));
  return 'deleted';
}

export async function toggleMerchantProductActive(
  productId: string,
  active: boolean,
  merchantId?: string,
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');
  await requireAdminAuth();

  let upd = supabase.from('products').update({ active }).eq('id', productId).select('id, active');
  if (merchantId) upd = upd.eq('merchant_id', merchantId);
  const { data, error } = await upd.maybeSingle();
  if (error) throw error;
  if (!data || data.active !== active) {
    throw new Error(authDeniedMessage('update this product'));
  }
}

/** Import starter catalog (Classic T-Shirt, etc.) — skips SKUs already in DB. */
export async function importDemoCatalog(merchantId: string, siteUrl?: string): Promise<{ added: number; skipped: number }> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase.rpc('seed_pangolin_demo_catalog', {
    p_merchant_id: merchantId,
    p_site_url: siteUrl ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'https://veebrown.vercel.app',
  });
  if (error) throw error;
  const row = data as { ok?: boolean; added?: number; skipped?: number; error?: string };
  if (!row?.ok) throw new Error(row?.error ?? 'Import failed');
  return { added: Number(row.added ?? 0), skipped: Number(row.skipped ?? 0) };
}

export async function productToFormDefaults(p: FashionProduct) {
  const details = p.item_details ?? {};
  const variants = p.variants?.length
    ? p.variants
    : await fetchProductVariants(p.id);
  const sizes = variants.length
    ? variants.map((v) => v.label).join(', ')
    : Array.isArray(details.sizes)
      ? (details.sizes as Array<{ label?: string }>).map((s) => s.label).filter(Boolean).join(', ')
      : '';
  const colors = Array.isArray(details.colors)
    ? (details.colors as Array<{ name?: string; hex?: string }>)
        .map((c) => (c.hex && c.hex !== '#888888' ? `${c.name}:${c.hex}` : c.name))
        .filter(Boolean)
        .join(', ')
    : '';
  return {
    name: p.name,
    price: String(p.price),
    description: p.description ?? '',
    categoryId: p.category_id ?? '',
    stock: p.stock_quantity != null ? String(p.stock_quantity) : '',
    featured: Boolean(details.featured),
    sizes,
    colors,
    fabric: typeof details.fabric === 'string' ? details.fabric : '',
    rating: details.rating != null ? String(details.rating) : '',
    reviewCount: details.review_count != null ? String(details.review_count) : '',
    existingImages: p.images?.length ? p.images : p.image_url ? [p.image_url] : [],
    variants: variants.map((v) => ({
      id: v.id,
      label: v.label,
      stockQuantity: v.stock_quantity ?? null,
      price: v.price ?? null,
    })),
  };
}
